import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Wifi, WifiOff, Leaf, BookOpen, Newspaper, ShieldAlert,
  AlertTriangle, RefreshCw, X, Megaphone, Circle, CheckCircle
} from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import { useSocket } from '../context/SocketContext'

const TYPE_CONFIG = {
  alert:  { icon: AlertTriangle, color: '#ff4444',  bg: 'rgba(255,68,68,0.08)',   border: 'rgba(255,68,68,0.2)',   label: 'Alert Dispatch' },
  news:   { icon: Newspaper,     color: '#06ffd4',  bg: 'rgba(6,255,212,0.08)',   border: 'rgba(6,255,212,0.2)',   label: 'News Update' },
  quiz:   { icon: BookOpen,      color: '#7c3aed',  bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', label: 'Quiz Activity' },
  carbon: { icon: Leaf,          color: '#22c55e',  bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  label: 'Carbon Request' },
  system: { icon: ShieldAlert,   color: '#00d4ff',  bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.2)',  label: 'System Event' },
  score:  { icon: CheckCircle,   color: '#ffcc00',  bg: 'rgba(255,204,0,0.08)',  border: 'rgba(255,204,0,0.2)',  label: 'Score Submitted' },
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function NotifCard({ notif, onDismiss }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
  const Icon = cfg.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-4 p-4 rounded-2xl border group relative overflow-hidden"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Left icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ color: cfg.color, background: `${cfg.color}15` }}>
            {cfg.label.toUpperCase()}
          </span>
          <span className="text-[10px] text-gray-600 font-mono ml-auto flex-shrink-0">{timeAgo(notif.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-snug">{notif.event}</p>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(notif.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-white flex-shrink-0"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  )
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Events' },
  { key: 'alert', label: 'Alerts' },
  { key: 'news', label: 'News' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'carbon', label: 'Carbon' },
]

export default function Notifications() {
  const { socket } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const idRef = useRef(0)

  const makeId = () => `local-${++idRef.current}`

  // Fetch historical log from server
  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (res.ok && data.notifications) {
        const mapped = data.notifications.map((n, i) => ({ ...n, id: n.id || `srv-${i}` }))
        setNotifications(mapped)
      }
    } catch (e) {
      console.warn('Notifications fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [])

  const pushNotif = (type, event) => {
    const notif = { id: makeId(), type, event, timestamp: Date.now() }
    setNotifications(prev => [notif, ...prev].slice(0, 100))
  }

  // Socket event listeners — build live notification feed
  useEffect(() => {
    if (!socket) return

    setConnected(socket.connected)
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    // Admin alert dispatched
    const onBroadcast = (data) => pushNotif('alert', `📢 Admin broadcast: ${data.title || 'Alert'}${data.text ? ' — ' + data.text.slice(0, 80) : ''}`)
    // News article added
    const onArticleAdded = (article) => pushNotif('news', `📰 New article published: "${article.title}"`)
    // News article deleted
    const onArticleDeleted = ({ id }) => pushNotif('news', `🗑️ Article removed from feed (ID: ${id})`)
    // Quiz question added
    const onQuizAdded = (q) => pushNotif('quiz', `❓ New quiz question added: "${q.question?.slice(0, 60)}"`)
    // Quiz score submitted
    const onScore = (score) => pushNotif('score', `🏆 ${score.userName} completed the quiz with ${score.score}% (${score.xpGained} XP)`)
    // Carbon request created
    const onCarbon = (req) => pushNotif('carbon', `🌱 Carbon offset request: ${req.amount} tonnes for ${req.projectId}`)
    // Carbon status updated
    const onCarbonStatus = (req) => pushNotif('carbon', `✅ Carbon request ${req.status}: ${req.projectId} (${req.amount} tonnes)`)
    // Periodic alert
    const onAlertNew = (data) => pushNotif('alert', `⚡ System alert: ${data.type} — ${data.message}`)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('broadcast:alert', onBroadcast)
    socket.on('news:article-added', onArticleAdded)
    socket.on('news:article-deleted', onArticleDeleted)
    socket.on('quiz:question-added', onQuizAdded)
    socket.on('quiz:score-submitted', onScore)
    socket.on('carbon:request-created', onCarbon)
    socket.on('carbon:status-updated', onCarbonStatus)
    socket.on('alert:new', onAlertNew)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('broadcast:alert', onBroadcast)
      socket.off('news:article-added', onArticleAdded)
      socket.off('news:article-deleted', onArticleDeleted)
      socket.off('quiz:question-added', onQuizAdded)
      socket.off('quiz:score-submitted', onScore)
      socket.off('carbon:request-created', onCarbon)
      socket.off('carbon:status-updated', onCarbonStatus)
      socket.off('alert:new', onAlertNew)
    }
  }, [socket])

  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id))
  const clearAll = () => setNotifications([])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications(true)
    setRefreshing(false)
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)

  const counts = FILTER_OPTIONS.reduce((acc, opt) => {
    acc[opt.key] = opt.key === 'all' ? notifications.length : notifications.filter(n => n.type === opt.key).length
    return acc
  }, {})

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#070a13] text-white">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <span className="label-overline mb-2 inline-block">Platform Activity</span>
            <h1 className="text-4xl lg:text-5xl font-light font-display">
              Live <span className="gradient-text">Notifications</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xl mt-1">
              Real-time feed of all platform events — alerts, news, quiz scores, carbon requests, and system activity.
            </p>
          </div>

          {/* Connection + Actions */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 glass px-4 py-2 rounded-xl border ${connected ? 'border-neon-cyan/20' : 'border-red-500/20'}`}>
              {connected
                ? <Wifi size={14} className="text-neon-cyan" />
                : <WifiOff size={14} className="text-red-400" />
              }
              <span className={`text-xs font-mono ${connected ? 'text-neon-cyan' : 'text-red-400'}`}>
                {connected ? 'LIVE FEED' : 'DISCONNECTED'}
              </span>
              {connected && <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />}
            </div>
            <button
              onClick={handleRefresh}
              className="glass p-2.5 rounded-xl hover:neon-border-blue transition-all"
            >
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, ease: 'linear' }}>
                <RefreshCw size={15} className="text-neon-blue" />
              </motion.div>
            </button>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="glass px-3 py-2.5 rounded-xl text-xs font-mono text-gray-400 hover:text-red-400 transition-colors border border-white/5 hover:border-red-500/20"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {FILTER_OPTIONS.map(({ key, label }) => {
            const cfg = TYPE_CONFIG[key]
            const color = cfg?.color || '#aaaaaa'
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`glass rounded-2xl p-4 text-center transition-all border ${
                  filter === key ? 'border-neon-blue/30 bg-neon-blue/5' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="text-2xl font-bold font-outfit" style={{ color: filter === key ? '#00d4ff' : color }}>
                  {counts[key]}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-mono uppercase">{label}</div>
              </button>
            )
          })}
        </div>

        {/* Filter Pill Bar */}
        <div className="glass-strong rounded-2xl p-1.5 mb-6 flex items-center gap-1 overflow-x-auto">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                filter === key ? 'text-white bg-white/10 border border-white/15' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10">{counts[key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-gray-500">Loading activity log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-3xl p-16 text-center border border-white/5"
          >
            <Bell size={48} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-white font-display text-xl mb-2">No notifications yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Events will appear here in real-time as you interact with the platform — completing quizzes, publishing articles, dispatching alerts, and more.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-xs font-mono text-neon-cyan">
              <Circle size={8} className="animate-pulse fill-neon-cyan" />
              <span>Listening for live events...</span>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map(notif => (
                <NotifCard key={notif.id} notif={notif} onDismiss={dismiss} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
