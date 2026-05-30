import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Star, Trophy, Leaf, BookOpen, Edit3, Save, X, Camera,
  Shield, Clock, Mail, BarChart2, CheckCircle, XCircle, Loader2,
  Calendar, Zap, Award, TrendingUp, Activity, Crown, AlertCircle,
  ChevronRight, LogOut, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import VideoBackground from '../components/ui/VideoBackground'
import { useSocket } from '../context/SocketContext'

// ── Badge config ─────────────────────────────────────────────
const BADGE_CONFIG = {
  'Climate Scholar':    { color: '#00d4ff',  bg: 'rgba(0,212,255,0.1)',   icon: BookOpen,   desc: 'Completed 3+ quizzes' },
  'Eco-Guardian':       { color: '#22c55e',  bg: 'rgba(34,197,94,0.1)',   icon: Leaf,       desc: 'Funded a carbon offset project' },
  'Carbon Neutral':     { color: '#06ffd4',  bg: 'rgba(6,255,212,0.1)',   icon: Leaf,       desc: 'Offset 10+ tonnes of CO2' },
  'Quiz Champion':      { color: '#ffcc00',  bg: 'rgba(255,204,0,0.1)',   icon: Trophy,     desc: 'Scored 100% on a quiz' },
  'Streak Master':      { color: '#ff8800',  bg: 'rgba(255,136,0,0.1)',   icon: Zap,        desc: 'Maintained a 7-day streak' },
  'Climate Defender':   { color: '#7c3aed',  bg: 'rgba(124,58,237,0.1)', icon: Shield,     desc: 'Active member for 30+ days' },
  'Admin':              { color: '#ff0090',  bg: 'rgba(255,0,144,0.1)',   icon: Crown,      desc: 'Platform administrator' },
}

const STAT_COLOR_BY_SCORE = (s) => s >= 80 ? '#06ffd4' : s >= 60 ? '#ffcc00' : '#ff8800'

function StatCard({ icon: Icon, label, value, color = '#00d4ff', sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-white/5 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 text-gray-500">
        <Icon size={14} style={{ color }} />
        <span className="text-[11px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold font-outfit" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-gray-600 font-mono">{sub}</div>}
    </motion.div>
  )
}

function ScoreBar({ score, createdAt }) {
  const color = STAT_COLOR_BY_SCORE(score)
  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[10px] text-gray-500 font-mono w-14 shrink-0">{date}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold shrink-0" style={{ color }}>{score}%</span>
    </div>
  )
}

function CarbonStatusChip({ status }) {
  const cfg = {
    pending:  { color: '#ffcc00', label: 'PENDING' },
    approved: { color: '#06ffd4', label: 'APPROVED' },
    rejected: { color: '#ff4444', label: 'REJECTED' },
  }[status] || { color: '#aaa', label: status?.toUpperCase() }
  return (
    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  )
}

// ── Main Profile Page ─────────────────────────────────────────
export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const { userId: paramUserId } = useParams() // if admin views someone else
  const { socket } = useSocket()

  // Aesthetic preference toggle overrides
  const [cursorEnabled, setCursorEnabled] = useState(() => {
    const saved = localStorage.getItem('climateai:premium-cursor-enabled')
    return saved !== 'false' // default is true
  })
  const [magneticEnabled, setMagneticEnabled] = useState(() => {
    const saved = localStorage.getItem('climateai:magnetic-enabled')
    return saved !== 'false' // default is true
  })

  const targetId = paramUserId || user?._id
  const isOwnProfile = !paramUserId || paramUserId === user?._id
  const isAdmin = user?.role === 'admin'

  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [carbonReqs, setCarbonReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Carbon history state
  const [activeHistoryTab, setActiveHistoryTab] = useState('quiz') // 'quiz' | 'carbon'
  const [footprintHistory, setFootprintHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Admin users list
  const [allUsers, setAllUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  // ── Fetch profile data ──────────────────────────────────────
  const fetchProfile = async () => {
    if (!targetId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/profile/${targetId}`)
      const data = await res.json()
      if (res.ok && data.profile) {
        setProfile(data.profile)
        setScores(data.scores || [])
        setCarbonReqs(data.carbonRequests || [])
        setEditName(data.profile.name)
        setEditBio(data.profile.bio || '')
        setEditAvatar(data.profile.avatar || '')
      } else {
        // Fallback: use local user data for own profile
        if (isOwnProfile && user) {
          setProfile(user)
          setEditName(user.name)
          setEditBio(user.bio || '')
          setEditAvatar(user.avatar || '')
        } else {
          setError('Could not load profile')
        }
      }
    } catch {
      if (isOwnProfile && user) {
        setProfile(user)
        setEditName(user.name)
        setEditBio(user.bio || '')
        setEditAvatar(user.avatar || '')
      } else {
        setError('Network error')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch all users (admin only) ─────────────────────────────
  const fetchAllUsers = async () => {
    if (!isAdmin) return
    setUsersLoading(true)
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (res.ok && data.users) setAllUsers(data.users)
    } catch (e) {
      console.error('Failed to fetch users:', e)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    if (isAdmin && isOwnProfile) fetchAllUsers()
  }, [targetId, user])

  useEffect(() => {
    if (activeHistoryTab === 'carbon' && targetId) {
      const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
          const res = await fetch(`/api/profile/${targetId}/footprint-history`)
          const data = await res.json()
          if (res.ok && data.history) {
            setFootprintHistory(data.history)
          }
        } catch (e) {
          console.error('Failed to fetch footprint history:', e)
        } finally {
          setHistoryLoading(false)
        }
      }
      fetchHistory()
    }
  }, [activeHistoryTab, targetId])

  // Socket.IO real-time synchronization
  useEffect(() => {
    if (!socket) return

    const onCarbonCreated = (req) => {
      if (String(req.userId) === String(targetId)) {
        setCarbonReqs(prev => {
          if (prev.some(r => (r._id || r.id) === (req._id || req.id))) return prev
          return [req, ...prev]
        })
      }
    }

    const onCarbonUpdated = (req) => {
      if (String(req.userId) === String(targetId)) {
        setCarbonReqs(prev => prev.map(r => ((r._id || r.id) === (req._id || req.id) ? req : r)))
      }
    }

    const onQuizScoreSubmitted = (s) => {
      if (String(s.userId) === String(targetId)) {
        setScores(prev => {
          if (prev.some(x => new Date(x.createdAt).getTime() === new Date(s.createdAt).getTime())) return prev
          return [s, ...prev]
        })
        setProfile(prev => {
          if (!prev) return prev
          const currentStats = prev.quizStats || { xp: 0, completed: 0, streak: 0 }
          return {
            ...prev,
            quizStats: {
              ...currentStats,
              xp: currentStats.xp + (s.xpGained || 0),
              completed: currentStats.completed + 1,
              streak: currentStats.streak + 1
            }
          }
        })
      }
    }

    const onProfileUpdated = (data) => {
      if (String(data.userId) === String(targetId)) {
        fetchProfile()
      }
    }

    socket.on('carbon:request-created', onCarbonCreated)
    socket.on('carbon:status-updated', onCarbonUpdated)
    socket.on('quiz:score-submitted', onQuizScoreSubmitted)
    socket.on('profile:updated', onProfileUpdated)

    return () => {
      socket.off('carbon:request-created', onCarbonCreated)
      socket.off('carbon:status-updated', onCarbonUpdated)
      socket.off('quiz:score-submitted', onQuizScoreSubmitted)
      socket.off('profile:updated', onProfileUpdated)
    }
  }, [socket, targetId])

  // ── Save profile edits ───────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/profile/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, bio: editBio, avatar: editAvatar })
      })
      const data = await res.json()
      if (res.ok) {
        const patch = { name: editName, bio: editBio, avatar: editAvatar }
        setProfile(prev => ({ ...prev, ...patch }))
        if (isOwnProfile) updateUser(patch)
        setEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        // Optimistic update even if offline
        const patch = { name: editName, bio: editBio, avatar: editAvatar }
        setProfile(prev => ({ ...prev, ...patch }))
        if (isOwnProfile) updateUser(patch)
        setEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setSaveError('Network error — changes may not be saved')
    } finally {
      setSaving(false)
    }
  }

  // ── Admin: change user role ───────────────────────────────────
  const handleRoleChange = async (uid, newRole) => {
    try {
      const res = await fetch(`/api/profile/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        setAllUsers(prev => prev.map(u => (u._id === uid || u.id === uid) ? { ...u, role: newRole } : u))
      }
    } catch (e) {
      console.error('Role change failed:', e)
    }
  }

  // ── Admin: delete user ────────────────────────────────────────
  const handleDeleteUser = async (uid) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/profile/${uid}`, { method: 'DELETE' })
      if (res.ok) setAllUsers(prev => prev.filter(u => (u._id || u.id) !== uid))
    } catch (e) {
      console.error('Delete user failed:', e)
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  const totalXP = profile?.quizStats?.xp || 0
  const xpLevel = Math.floor(totalXP / 100) + 1
  const xpProgress = (totalXP % 100)
  const memberDays = profile?.createdAt
    ? Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000)
    : 0
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length)
    : 0
  const approvedCarbon = carbonReqs.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.amount || 0), 0)
  const carbonChartData = footprintHistory.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short' }),
    footprint: entry.value
  }))

  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden bg-[#070a13] text-white">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_214311_24de0b75-7eaa-4f42-86d8-8c2014ca2851.mp4"
        overlay="default"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-gray-500">Loading profile...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md mx-auto mt-16">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-8">

            {/* ── Profile Hero ──────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative"
            >
              {/* Decorative background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-neon-blue/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-neon-purple/10 rounded-full blur-[80px]" />
              </div>

              {/* Cover banner with high-tech HUD markings */}
              <div className="h-28 bg-gradient-to-r from-neon-blue/20 via-neon-purple/20 to-neon-cyan/20 relative">
                <div className="absolute inset-0 bg-animated-grid opacity-10" />
                
                {/* HUD markings on the cover banner */}
                <div className="absolute top-3 left-4 text-[8px] font-mono text-white/35 tracking-widest select-none">
                  USER_PROFILE_SYS // SECURE_NODE
                </div>
                <div className="absolute top-3 right-4 text-[8px] font-mono text-white/35 tracking-widest flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                  CORE_LINK_STABLE
                </div>
                <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-white/25 pointer-events-none" />
                <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-white/25 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-white/25 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-white/25 pointer-events-none" />
              </div>

              <div className="px-8 pb-8 relative">
                <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl border-4 border-[#070a13] overflow-hidden shadow-xl"
                      style={{ boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
                      <img
                        src={editing ? editAvatar : (profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0d1222&color=00d4ff&size=200`)}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {editing && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white" />
                      </label>
                    )}
                    {/* Role badge */}
                    {profile.role === 'admin' && (
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-lg">
                        <Crown size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name + bio area */}
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <div className="space-y-3 pt-3">
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Display Name</label>
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="bg-white/5 border border-white/10 focus:border-neon-cyan focus:outline-none text-white rounded-xl px-4 py-2 text-sm w-full max-w-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Avatar URL</label>
                          <input
                            value={editAvatar}
                            onChange={e => setEditAvatar(e.target.value)}
                            placeholder="https://..."
                            className="bg-white/5 border border-white/10 focus:border-neon-cyan focus:outline-none text-white rounded-xl px-4 py-2 text-sm w-full max-w-sm placeholder-gray-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Bio</label>
                          <textarea
                            value={editBio}
                            onChange={e => setEditBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={2}
                            className="bg-white/5 border border-white/10 focus:border-neon-cyan focus:outline-none text-white rounded-xl px-4 py-2 text-sm w-full max-w-sm placeholder-gray-600 resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-2xl font-display text-white">{profile.name}</h1>
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold ${
                            profile.role === 'admin'
                              ? 'text-neon-pink bg-neon-pink/10 border-neon-pink/30'
                              : 'text-neon-blue bg-neon-blue/10 border-neon-blue/30'
                          }`}>
                            {profile.role?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                          <Mail size={11} />
                          <span className="text-xs">{profile.email}</span>
                        </div>
                        {profile.bio && (
                          <p className="text-sm text-gray-400 mt-2 max-w-md leading-relaxed">{profile.bio}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            Joined {memberDays}d ago
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Last seen {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(isOwnProfile || isAdmin) && (
                      editing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-mono bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan rounded-xl transition-colors disabled:opacity-50"
                          >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditing(false); setSaveError('') }}
                            className="p-2 glass rounded-xl text-gray-400 hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-mono glass hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 rounded-xl transition-colors"
                        >
                          <Edit3 size={12} />
                          Edit Profile
                        </button>
                      )
                    )}
                    {isOwnProfile && (
                      <button
                        onClick={() => { logout(); navigate('/login') }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-mono glass hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-colors"
                      >
                        <LogOut size={12} />
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>

                {/* Save feedback */}
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 flex items-center gap-2 text-xs text-neon-cyan font-mono"
                    >
                      <CheckCircle size={12} />
                      Profile updated successfully
                    </motion.div>
                  )}
                  {saveError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-mono"
                    >
                      <AlertCircle size={12} />
                      {saveError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ── XP Level Progress ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-3xl p-6 border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-display">Level {xpLevel} Climate Champion</div>
                    <div className="text-xs text-gray-500 font-mono">{totalXP} XP Total · {100 - xpProgress} XP to next level</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400 font-outfit">{xpProgress}<span className="text-sm text-gray-500">/100</span></div>
                  <div className="text-[10px] text-gray-600 font-mono">XP THIS LEVEL</div>
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  style={{ boxShadow: '0 0 12px rgba(251,191,36,0.5)' }}
                />
              </div>
            </motion.div>

            {/* ── Stats Grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={Star} label="Total XP" value={totalXP} color="#ffcc00" sub={`Level ${xpLevel}`} />
              <StatCard icon={Leaf} label="Annual Footprint" value={`${profile.footprint || 0}t`} color="#00d4ff" sub="calculated footprint" />
              <StatCard icon={BookOpen} label="Quizzes Done" value={profile.quizStats?.completed || 0} color="#7c3aed" sub={`${avgScore}% avg score`} />
              <StatCard icon={Zap} label="Day Streak" value={profile.quizStats?.streak || 0} color="#ff8800" sub="consecutive days" />
              <StatCard icon={Leaf} label="CO2 Offset" value={`${approvedCarbon}t`} color="#22c55e" sub="approved credits" />
            </div>

            {/* ── Aesthetic Preferences ───────────────────────────── */}
            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-strong rounded-3xl p-6 border border-white/5"
              >
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center shadow-lg">
                      <Activity size={18} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-white font-display text-lg">Aesthetic Preferences</h2>
                      <p className="text-xs text-gray-500">Customize interactive interface components and custom cursor effects</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    {/* Toggle: Premium Cursor & Click Animations */}
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Premium Cursor & Click Trails</span>
                        <span className="text-[10px] text-gray-500 font-mono">Custom glowing pointer with interactive halo & sparkle sweeps</span>
                      </div>
                      <button
                        onClick={() => {
                          const newVal = !cursorEnabled
                          setCursorEnabled(newVal)
                          localStorage.setItem('climateai:premium-cursor-enabled', String(newVal))
                          window.dispatchEvent(new Event('climateai:cursor-preference-updated'))
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                          cursorEnabled ? 'bg-neon-cyan justify-end' : 'bg-white/10 justify-start'
                        }`}
                        title="Toggle custom cursor and mouse click/hover trails"
                      >
                        <motion.div layout className="w-4 h-4 rounded-full bg-dark-900 shadow-md" />
                      </button>
                    </div>

                    {/* Toggle: Magnetic Attractions */}
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">Magnetic Attraction Easing</span>
                        <span className="text-[10px] text-gray-500 font-mono">Pulls buttons and active tabs magnetically toward cursor sweeps</span>
                      </div>
                      <button
                        onClick={() => {
                          const newVal = !magneticEnabled
                          setMagneticEnabled(newVal)
                          localStorage.setItem('climateai:magnetic-enabled', String(newVal))
                          window.dispatchEvent(new Event('climateai:magnetic-preference-updated'))
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                          magneticEnabled ? 'bg-neon-cyan justify-end' : 'bg-white/10 justify-start'
                        }`}
                        title="Toggle magnetic button and tab pull factor"
                      >
                        <motion.div layout className="w-4 h-4 rounded-full bg-dark-900 shadow-md" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Badges ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-strong rounded-3xl p-6 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-5">
                <Award size={16} className="text-yellow-400" />
                <h2 className="text-lg font-display text-white">Achievement Badges</h2>
                <span className="text-xs font-mono text-gray-500 ml-1">({profile.badges?.length || 0} earned)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Earned Badges */}
                {(profile.badges || []).map(badge => {
                  const cfg = BADGE_CONFIG[badge] || { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', icon: Star, desc: '' }
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={badge}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border group cursor-default"
                      style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
                      title={cfg.desc}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cfg.color}20` }}>
                        <Icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{badge}</div>
                        {cfg.desc && <div className="text-[10px] text-gray-500">{cfg.desc}</div>}
                      </div>
                    </motion.div>
                  )
                })}

                {/* Locked Badges */}
                {Object.entries(BADGE_CONFIG)
                  .filter(([name]) => name !== 'Admin' && !(profile.badges || []).includes(name))
                  .map(([name, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-dashed border-white/10 bg-white/5 opacity-40 cursor-help"
                        title={`Locked: ${cfg.desc}`}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
                          <Icon size={14} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-400">{name}</div>
                          <div className="text-[10px] text-gray-600 font-mono">Unlock: {cfg.desc}</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>

            {/* ── Bottom grid: Quiz History + Carbon History ──────── */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Quiz & Carbon Journey History */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-strong rounded-3xl p-6 border border-white/5"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveHistoryTab('quiz')}
                      className={`flex items-center gap-2 pb-1.5 border-b-2 font-display text-sm transition-all ${
                        activeHistoryTab === 'quiz' ? 'border-neon-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <BarChart2 size={15} />
                      Quiz History
                    </button>
                    <button
                      onClick={() => setActiveHistoryTab('carbon')}
                      className={`flex items-center gap-2 pb-1.5 border-b-2 font-display text-sm transition-all ${
                        activeHistoryTab === 'carbon' ? 'border-neon-cyan text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <TrendingUp size={15} />
                      Carbon Journey
                    </button>
                  </div>
                  <span className="text-xs font-mono text-gray-500">
                    {activeHistoryTab === 'quiz' ? `(${scores.length} sessions)` : `(${footprintHistory.length} entries)`}
                  </span>
                </div>

                {activeHistoryTab === 'quiz' ? (
                  scores.length === 0 ? (
                    <div className="py-8 text-center">
                      <BookOpen size={28} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 font-mono">No quiz sessions yet. Take your first quiz!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {scores.slice(0, 8).map((s, i) => (
                        <ScoreBar key={i} score={s.score} createdAt={s.createdAt} />
                      ))}
                      {scores.length > 8 && (
                        <p className="text-[10px] text-gray-600 font-mono pt-2 text-center">+{scores.length - 8} more sessions</p>
                      )}
                    </div>
                  )
                ) : (
                  historyLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-xs text-gray-500 font-mono">
                      <Loader2 size={14} className="animate-spin text-neon-cyan" />
                      Loading history...
                    </div>
                  ) : (
                    carbonChartData.length === 0 ? (
                      <div className="py-12 text-center">
                        <Leaf size={32} className="text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 font-mono mb-4">No footprint history logged yet.</p>
                        <button
                          onClick={() => navigate('/calculator')}
                          className="px-4 py-2 text-xs font-mono bg-neon-cyan/20 border border-neon-cyan/40 hover:bg-neon-cyan/30 text-neon-cyan rounded-xl transition-all"
                        >
                          Calculate Footprint
                        </button>
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={carbonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="carbonGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06ffd4" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#06ffd4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} fontFamily="monospace" />
                            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} fontFamily="monospace" unit="t" />
                            <Tooltip
                              contentStyle={{ background: '#0d1222', borderColor: 'rgba(6,255,212,0.2)', borderRadius: '12px' }}
                              labelStyle={{ color: '#aaa', fontFamily: 'monospace', fontSize: '11px' }}
                              itemStyle={{ color: '#06ffd4', fontFamily: 'monospace', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="footprint" stroke="#06ffd4" fillOpacity={1} fill="url(#carbonGlow)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  )
                )}
              </motion.div>

              {/* Carbon Requests */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-strong rounded-3xl p-6 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Leaf size={16} className="text-neon-cyan" />
                  <h2 className="text-lg font-display text-white">Carbon Offsets</h2>
                  <span className="text-xs font-mono text-gray-500">({carbonReqs.length} requests)</span>
                </div>
                {carbonReqs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Leaf size={28} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 font-mono">No carbon offset requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {carbonReqs.slice(0, 6).map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                          <Leaf size={13} className="text-neon-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-mono truncate">{req.projectId}</p>
                          <p className="text-[10px] text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-neon-cyan font-outfit">{req.amount}t</div>
                          <CarbonStatusChip status={req.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Admin: User Management Panel ─────────────────────── */}
            {isAdmin && isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-strong rounded-3xl p-6 border border-neon-pink/10 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
                      <Crown size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display text-white">User Management</h2>
                      <p className="text-xs text-gray-500">Admin-only — manage all platform users</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchAllUsers}
                    className="glass p-2 rounded-xl text-gray-400 hover:text-neon-cyan transition-colors"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {usersLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-500 font-mono">
                    <Loader2 size={14} className="animate-spin text-neon-pink" />
                    Loading users...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUsers.map((u, i) => (
                      <motion.div
                        key={u._id || u.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                      >
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0d1222&color=00d4ff&size=80`}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{u.name}</span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                              u.role === 'admin'
                                ? 'text-neon-pink bg-neon-pink/10 border border-neon-pink/20'
                                : 'text-gray-500 bg-white/5 border border-white/10'
                            }`}>
                              {u.role?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-yellow-400 font-mono">{u.quizStats?.xp || 0} XP</span>
                            <span className="text-[10px] text-gray-600 font-mono">{u.badges?.length || 0} badges</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => navigate(`/profile/${u._id || u.id}`)}
                            className="p-1.5 rounded-lg glass text-gray-400 hover:text-neon-cyan transition-colors"
                            title="View profile"
                          >
                            <ChevronRight size={13} />
                          </button>
                          {u.role !== 'admin' ? (
                            <button
                              onClick={() => handleRoleChange(u._id || u.id, 'admin')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-neon-pink/10 hover:bg-neon-pink/20 border border-neon-pink/20 text-neon-pink transition-colors"
                            >
                              Make Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u._id || u.id, 'user')}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 text-gray-400 transition-colors"
                            >
                              Revoke Admin
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u._id || u.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {allUsers.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-600 font-mono">
                        No users found. Database may be offline.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
