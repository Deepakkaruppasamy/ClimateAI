import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Server, Users, Zap, Database, Cpu,
  TrendingUp, Globe, AlertCircle, CheckCircle, Clock,
  BarChart2, RefreshCw, Shield, BellRing, Trash2, ShieldAlert, Play, Plus, Loader2,
  Newspaper, BookOpen, Leaf
} from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import NewsModeration from '../components/admin/NewsModeration'
import QuizCMS from '../components/admin/QuizCMS'
import CarbonAudit from '../components/admin/CarbonAudit'
import StressTestControls from '../components/admin/StressTestControls'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-strong rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}{p.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ── Simulated real-time metrics ────────────────────────────
function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 38, memory: 62, requests: 1420, latency: 124,
    uptime: 99.97, activeUsers: 2847, apiCalls: 84200, errors: 3,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 6)),
        memory: Math.max(40, Math.min(85, prev.memory + (Math.random() - 0.5) * 3)),
        requests: Math.round(prev.requests + (Math.random() - 0.3) * 50),
        latency: Math.max(80, Math.min(300, prev.latency + (Math.random() - 0.5) * 20)),
        uptime: 99.97,
        activeUsers: Math.round(prev.activeUsers + (Math.random() - 0.4) * 10),
        apiCalls: prev.apiCalls + Math.round(Math.random() * 30),
        errors: Math.max(0, prev.errors + (Math.random() > 0.9 ? 1 : 0)),
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return metrics
}

// ── Generate sparkline history ─────────────────────────────
function generateHistory(length = 20, base = 50, variance = 15) {
  return Array.from({ length }, (_, i) => ({
    t: `${i}m`,
    v: Math.max(0, base + Math.sin(i * 0.5) * variance + (Math.random() - 0.5) * variance * 0.5),
  }))
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    operational: { color: '#06ffd4', bg: 'rgba(6,255,212,0.1)', label: '● OPERATIONAL' },
    degraded: { color: '#ffcc00', bg: 'rgba(255,204,0,0.1)', label: '● DEGRADED' },
    outage: { color: '#ff4444', bg: 'rgba(255,68,68,0.1)', label: '● OUTAGE' },
  }
  const s = styles[status] || styles.operational
  return (
    <span className="text-xs px-2 py-1 rounded-full font-mono font-bold"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}

// ── Gauge Ring ─────────────────────────────────────────────
function GaugeRing({ value, max = 100, color, label, size = 80 }) {
  const pct = (value / max) * 100
  const r = size / 2 - 8
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <motion.circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white font-outfit">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────
function AdminMetricCard({ icon: Icon, label, value, unit, color, trend, sparkData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 card-hover relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at 80% 20%, ${color}08, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold font-outfit text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5 mb-3">{label}</div>
      {sparkData && (
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
              fill={`url(#spark-${label})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

// ── Service Status ─────────────────────────────────────────
const services = [
  { name: 'Weather API Gateway', status: 'operational', latency: '42ms', uptime: '99.99%' },
  { name: 'AI Inference Engine', status: 'operational', latency: '180ms', uptime: '99.94%' },
  { name: 'Real-time Socket Server', status: 'operational', latency: '12ms', uptime: '100%' },
  { name: 'MongoDB Cluster', status: 'operational', latency: '8ms', uptime: '99.99%' },
  { name: 'Open-Meteo Proxy', status: 'operational', latency: '95ms', uptime: '99.87%' },
  { name: 'Alert Notification Service', status: 'operational', latency: '22ms', uptime: '99.97%' },
]

// ── Recent Activity ────────────────────────────────────────
const activities = [
  { time: '13:57', event: 'New user connected from Mumbai', type: 'user', color: '#00d4ff' },
  { time: '13:55', event: 'Thunderstorm alert dispatched — 3 regions', type: 'alert', color: '#ff4444' },
  { time: '13:52', event: 'AI forecast model updated — v2.4.1', type: 'system', color: '#7c3aed' },
  { time: '13:48', event: 'Weather API rate limit warning (89%)', type: 'warning', color: '#ffcc00' },
  { time: '13:45', event: 'Groq AI endpoint health check passed', type: 'system', color: '#06ffd4' },
  { time: '13:40', event: '42 users active on Dashboard page', type: 'user', color: '#00d4ff' },
  { time: '13:38', event: 'Cache invalidated — weather data refreshed', type: 'system', color: '#7c3aed' },
  { time: '13:35', event: 'High UV alert auto-generated for 5 cities', type: 'alert', color: '#ff8800' },
]

// ── Main Admin Page ────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const metrics = useRealtimeMetrics()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard',     icon: Activity,  color: '#00d4ff' },
    { id: 'news',      label: 'News Moderation', icon: Newspaper, color: '#06ffd4' },
    { id: 'articles',  label: 'Articles CMS',  icon: Newspaper, color: '#00d4ff' },
    { id: 'quiz',      label: 'Quiz CMS',      icon: BookOpen,  color: '#7c3aed' },
    { id: 'carbon',    label: 'Carbon Audit',  icon: Leaf,      color: '#22c55e' },
    { id: 'stress',    label: 'Stress Testing',icon: Zap,       color: '#ff8800' },
  ]

  // Rules states
  const [rules, setRules] = useState([])
  const [loadingRules, setLoadingRules] = useState(true)
  const [errorRules, setErrorRules] = useState('')
  
  // Form states
  const [city, setCity] = useState('Paris')
  const [metric, setMetric] = useState('temp')
  const [condition, setCondition] = useState('greater')
  const [value, setValue] = useState(40)
  const [submittingRule, setSubmittingRule] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  // Push Alert Simulator states
  const [simulatedAlert, setSimulatedAlert] = useState(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customText, setCustomText] = useState('')
  const [customSeverity, setCustomSeverity] = useState('critical')
  const [targetCity, setTargetCity] = useState('')

  // ── Emails Sent & Realtime Active Users State & Polling ──────
  const [emailsSentCount, setEmailsSentCount] = useState(0)
  const [realtimeActiveUsers, setRealtimeActiveUsers] = useState(1)

  const fetchBackendMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics')
      const data = await res.json()
      if (res.ok && data.stats) {
        setEmailsSentCount(data.stats.emailsSent || 0)
        setRealtimeActiveUsers(data.stats.activeUsers || 0)
      }
    } catch (e) {
      console.warn('Backend metrics fetch failed:', e)
    }
  }

  useEffect(() => {
    fetchBackendMetrics()
    const interval = setInterval(fetchBackendMetrics, 3000)
    return () => clearInterval(interval)
  }, [])

  // IoT Simulator states
  const [uvSim, setUvSim] = useState(5)
  const [soilSim, setSoilSim] = useState('normal')
  const [sensorFaultSim, setSensorFaultSim] = useState(false)

  // Synthesize double-beep warning chime using browser Web Audio API
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      // Beep 1
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(660, ctx.currentTime) // E5 note
      gain1.gain.setValueAtTime(0.08, ctx.currentTime)
      osc1.start()
      osc1.stop(ctx.currentTime + 0.12)
      
      // Beep 2 (delayed)
      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, ctx.currentTime) // A5 note
        gain2.gain.setValueAtTime(0.08, ctx.currentTime)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.22)
      }, 120)
    } catch (e) {
      console.warn('Audio synthesis block:', e)
    }
  }

  // Fetch user alert rules
  const fetchRules = async () => {
    setLoadingRules(true)
    setErrorRules('')
    try {
      const res = await fetch('/api/alerts/rules')
      const data = await res.json()
      if (res.ok && data.rules) {
        setRules(data.rules)
      } else {
        setErrorRules('Failed to query active rule databases.')
      }
    } catch (e) {
      setErrorRules('Error connecting to alerts router.')
    } finally {
      setLoadingRules(false)
    }
  }

  // Add rule
  const handleAddRule = async (e) => {
    e.preventDefault()
    if (!city || !value) return
    setSubmittingRule(true)
    setErrorForm('')

    try {
      const res = await fetch('/api/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.googleId || 'mock',
          city,
          metric,
          condition,
          value: parseFloat(value)
        })
      })
      const data = await res.json()
      if (res.ok && data.rule) {
        setRules([...rules, data.rule])
        setValue(40)
      } else {
        setErrorForm(data.error || 'Failed to register rule.')
      }
    } catch (err) {
      setErrorForm('Error connecting to backend rule services.')
    } finally {
      setSubmittingRule(false)
    }
  }

  // Delete rule
  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setRules(rules.filter(r => r.id !== ruleId && r._id !== ruleId))
      } else {
        setErrorRules('Failed to remove selected rule.')
      }
    } catch (e) {
      setErrorRules('Connection failure during rule removal.')
    }
  }

  // Trigger emergency events simulation
  const handleTriggerSimulation = (type) => {
    let title = 'Heatwave Advisory'
    let text = 'Telemetry reports Paris average temp has exceeded 40°C threshold limit.'
    let color = 'border-red-500/30 text-red-400 bg-red-500/10'

    if (type === 'storm') {
      title = 'Extreme Wind Trigger'
      text = 'Telemetry reports New York winds exceed 150 km/h limit caps.'
      color = 'border-purple-500/30 text-purple-400 bg-purple-500/10'
    } else if (type === 'aqi') {
      title = 'Critical AQI Warning'
      text = 'Telemetry reports New York Air Quality index has crossed critical 150 boundary.'
      color = 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    }

    if (socket) {
      socket.emit('admin:dispatch-alert', { title, text, color, type })
    } else {
      playAlertSound()
      setSimulatedAlert({ title, text, color })
      setTimeout(() => setSimulatedAlert(null), 6000)
    }
  }

  const handleCustomBroadcast = (e) => {
    e.preventDefault()
    if (!customText) return

    let color = 'border-red-500/30 text-red-400 bg-red-500/10'
    if (customSeverity === 'warning') {
      color = 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    } else if (customSeverity === 'info') {
      color = 'border-neon-blue/30 text-neon-blue bg-neon-blue/10'
    }

    const title = customTitle || 'Staff Advisory'

    if (socket) {
      socket.emit('admin:dispatch-alert', { title, text: customText, color, targetCity })
      setCustomTitle('')
      setCustomText('')
      setTargetCity('')
    }
  }

  // Handle IoT simulation dispatch
  useEffect(() => {
    if (socket) {
      socket.emit('admin:simulate-iot', { uv: uvSim, soil: soilSim, fault: sensorFaultSim })
    }
  }, [uvSim, soilSim, sensorFaultSim, socket])

  useEffect(() => {
    fetchRules()
  }, [])

  // Hourly traffic data
  const trafficData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    requests: Math.round(500 + Math.sin((i / 24) * Math.PI * 2) * 400 + Math.random() * 200),
    errors: Math.round(Math.random() * 5),
    users: Math.round(200 + Math.sin((i / 24) * Math.PI * 2) * 150 + Math.random() * 100),
  }))

  const sparkCpu = generateHistory(20, metrics.cpu, 10)
  const sparkMem = generateHistory(20, metrics.memory, 8)
  const sparkReq = generateHistory(20, metrics.requests / 100, 5)
  const sparkLat = generateHistory(20, metrics.latency, 30)
  const sparkEmails = generateHistory(20, emailsSentCount > 0 ? emailsSentCount : 0, 3)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12 relative overflow-hidden"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-15 pointer-events-none z-[3]" />
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-neon-cyan" />
              <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">Admin Access</span>
            </div>
            <h1 className="heading-display text-3xl text-white">
              System <span className="gradient-text">Monitoring</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-sm font-mono text-neon-cyan">LIVE MONITORING</span>
            </div>
            <button
              onClick={handleRefresh}
              className="glass p-2 rounded-xl hover:neon-border-blue transition-all"
            >
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 1, ease: 'linear' }}>
                <RefreshCw size={16} className="text-neon-blue" />
              </motion.div>
            </button>
          </div>
        </div>
        {/* ── Horizontal Tab Bar ───────────────────────── */}
        <div className="glass-strong rounded-2xl p-1.5 mb-6 flex items-center gap-1 overflow-x-auto">
          {adminTabs.map(tab => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-tab-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${tab.color}18`, border: `1px solid ${tab.color}30` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <TabIcon size={13} style={{ color: isActive ? tab.color : undefined }} />
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Non-Dashboard Tab Panels ─────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="glass-strong rounded-3xl p-6 border border-white/5">
                <NewsModeration socket={socket} />
              </div>
            </motion.div>
          )}
          {activeTab === 'articles' && (
            <motion.div key="articles" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="glass-strong rounded-3xl p-6 border border-white/5">
                <NewsModeration socket={socket} />
              </div>
            </motion.div>
          )}
          {activeTab === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="glass-strong rounded-3xl p-6 border border-white/5">
                <QuizCMS socket={socket} />
              </div>
            </motion.div>
          )}
          {activeTab === 'carbon' && (
            <motion.div key="carbon" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="glass-strong rounded-3xl p-6 border border-white/5">
                <CarbonAudit socket={socket} />
              </div>
            </motion.div>
          )}
          {activeTab === 'stress' && (
            <motion.div key="stress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <div className="glass-strong rounded-3xl p-6 border border-white/5">
                <StressTestControls socket={socket} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dashboard Tab Content ────────────────────── */}
        {activeTab === 'dashboard' && (<>

        {/* ── Server Health Gauges ─────────────────────── */}
        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-section text-lg text-white">Server Health</h2>
            <StatusBadge status="operational" />
          </div>
          <div className="flex flex-wrap gap-8 justify-around">
            <GaugeRing value={metrics.cpu} color="#00d4ff" label="CPU Usage" />
            <GaugeRing value={metrics.memory} color="#7c3aed" label="Memory" />
            <GaugeRing value={75} color="#06ffd4" label="Disk I/O" />
            <GaugeRing value={metrics.uptime} color="#22c55e" label="Uptime" />
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold font-outfit text-white">{metrics.latency}ms</div>
                <div className="text-xs text-gray-500 mt-1">Avg. Latency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold font-outfit text-neon-blue">{metrics.requests.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Req/min</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold font-outfit text-neon-purple">{realtimeActiveUsers.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold font-outfit text-neon-cyan">{metrics.apiCalls.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">API Calls Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sparkline Metrics ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <AdminMetricCard icon={Cpu} label="CPU Utilization" value={Math.round(metrics.cpu)} unit="%" color="#00d4ff" trend={2.1} sparkData={sparkCpu} />
          <AdminMetricCard icon={Database} label="Memory Usage" value={Math.round(metrics.memory)} unit="%" color="#7c3aed" trend={-0.5} sparkData={sparkMem} />
          <AdminMetricCard icon={Activity} label="Requests/min" value={metrics.requests} unit="" color="#06ffd4" trend={12.3} sparkData={sparkReq} />
          <AdminMetricCard icon={Clock} label="Response Time" value={metrics.latency} unit="ms" color="#ff8800" trend={-8.1} sparkData={sparkLat} />
          <AdminMetricCard icon={Zap} label="Alert Emails Sent" value={emailsSentCount} unit="mails" color="#ff0090" trend={emailsSentCount > 0 ? 100 : 0} sparkData={sparkEmails} />
        </div>

        {/* ── Traffic Charts ───────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Hourly Traffic */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-section text-lg text-white">Hourly API Traffic</h3>
              <span className="text-xs font-mono text-gray-500">Last 24 hours</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" stroke="#555" tick={{ fontSize: 10 }} interval={3} />
                <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                <Tooltip content={CustomTooltip} />
                <Area type="monotone" dataKey="requests" stroke="#00d4ff" strokeWidth={2}
                  fill="url(#reqGrad)" dot={false} name="Requests" />
                <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2}
                  fill="url(#userGrad)" dot={false} name="Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rate */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-4">Error Rate</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl font-bold font-outfit text-neon-cyan">{metrics.errors}</div>
              <div>
                <div className="text-sm text-gray-300">Total Errors</div>
                <div className="text-xs text-emerald-400">▼ 0.002% rate</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={trafficData.filter((_, i) => i % 4 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" stroke="#555" tick={{ fontSize: 9 }} />
                <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="errors" fill="#ff4444" fillOpacity={0.7} radius={[3,3,0,0]} name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Service Status + Activity ────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Service Status */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-4 flex items-center gap-2">
              <Server size={16} className="text-neon-blue" /> Service Status
            </h3>
            <div className="space-y-3">
              {services.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={14} className="text-neon-cyan flex-shrink-0" />
                    <span className="text-sm text-gray-300">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-mono">{s.latency}</span>
                    <span className="text-xs text-gray-600">{s.uptime}</span>
                    <StatusBadge status={s.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-neon-purple" /> Live Activity Feed
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activities.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="text-xs text-gray-600 font-mono mt-0.5 flex-shrink-0">{a.time}</span>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                  <span className="text-sm text-gray-400">{a.event}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── User Geography ───────────────────────────── */}
        <div className="glass rounded-2xl p-6 mt-6">
          <h3 className="heading-section text-lg text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-neon-blue" /> User Geography
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { region: 'North America', users: 1240, pct: 43, color: '#00d4ff' },
              { region: 'Europe', users: 890, pct: 31, color: '#7c3aed' },
              { region: 'Asia Pacific', users: 520, pct: 18, color: '#06ffd4' },
              { region: 'South America', users: 140, pct: 5, color: '#ff8800' },
              { region: 'Others', users: 57, pct: 3, color: '#ff0090' },
            ].map(({ region, users, pct, color }) => (
              <div key={region} className="glass rounded-xl p-4 text-center">
                <div className="text-lg font-bold font-outfit" style={{ color }}>{users.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">{region}</div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">{pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Smart Trigger Alerts & Simulator ───────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mt-6">
          
          {/* Rules Builder Form */}
          <div className="xl:col-span-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative space-y-6">
              <div>
                <h3 className="text-lg text-white font-normal font-display">Add Alert Rule</h3>
                <p className="text-gray-400 text-xs mt-1">Create a custom threshold trigger on target city datasets.</p>
              </div>

              <form onSubmit={handleAddRule} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Target City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris, New York, London"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-neon-pink focus:outline-none text-white rounded-xl text-sm font-sans placeholder-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Metric</label>
                    <select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      className="w-full px-3 py-3 bg-[#0d1222] border border-white/10 focus:border-neon-pink focus:outline-none text-white rounded-xl text-xs font-mono"
                    >
                      <option value="temp">Temp (°C)</option>
                      <option value="wind">Wind (km/h)</option>
                      <option value="uv">UV Index</option>
                      <option value="aqi">AQI Index</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3 py-3 bg-[#0d1222] border border-white/10 focus:border-neon-pink focus:outline-none text-white rounded-xl text-xs font-mono"
                    >
                      <option value="greater">Exceeds (&gt;)</option>
                      <option value="less">Drops Below (&lt;)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Threshold Limit Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-neon-pink focus:outline-none text-white rounded-xl text-sm font-mono"
                  />
                </div>

                {errorForm && (
                  <span className="text-[10px] text-red-400 font-mono block">{errorForm}</span>
                )}

                <button
                  type="submit"
                  disabled={submittingRule}
                  className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-3.5 bg-gradient-to-r from-neon-pink to-rose-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-neon-pink/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-xs font-mono"
                >
                  <Plus size={14} />
                  <span>REGISTER ALERTS TRIGGER</span>
                </button>
              </form>
            </div>
          </div>

          {/* Active Rules List & Simulators */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Active Rules Grid */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
              <h3 className="text-lg text-white font-normal font-display">Active Threshold Rules</h3>
              
              {loadingRules ? (
                <div className="py-8 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-neon-pink" />
                  <span>Scanning alert rule registries...</span>
                </div>
              ) : errorRules ? (
                <div className="py-8 text-center text-red-400 text-xs font-mono border border-red-500/10 bg-red-500/5 rounded-2xl">
                  {errorRules}
                </div>
              ) : rules.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-gray-500">
                  No active rules configured. Use the builder to register thresholds.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.map((rule) => (
                    <div 
                      key={rule.id || rule._id}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-neon-pink font-mono text-[10px] uppercase">
                          <BellRing size={10} />
                          <span>Active Rule</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1">
                          {rule.city} Alert trigger
                        </h4>
                        <p className="text-[11px] text-gray-400 font-mono mt-1 leading-none uppercase">
                          {rule.metric} {rule.condition === 'greater' ? 'exceeds' : 'drops below'} {rule.value}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteRule(rule.id || rule._id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-white rounded-xl transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulators Portal */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative space-y-4">
              <div>
                <h3 className="text-lg text-white font-normal font-display">Emergency Telemetry Simulator</h3>
                <p className="text-gray-400 text-xs mt-1">Simulate local environmental anomalies to verify rule conditions and warning systems.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: 'heat', title: 'Simulate Heatwave', color: 'border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-400' },
                  { type: 'storm', title: 'Simulate Windstorm', color: 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-400' },
                  { type: 'aqi', title: 'Simulate AQI Spike', color: 'border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400' }
                ].map((sim) => (
                  <button
                    key={sim.type}
                    onClick={() => handleTriggerSimulation(sim.type)}
                    className={`p-4 bg-white/5 border rounded-2xl flex items-center justify-between gap-3 text-left font-mono text-xs transition-all ${sim.color}`}
                  >
                    <span>{sim.title}</span>
                    <Play size={12} className="fill-current" />
                  </button>
                ))}
              </div>

              {/* Dynamic IoT Controllers */}
              <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                <h4 className="text-sm font-semibold text-white mb-2 font-display">IoT Sensor Array Controls</h4>
                
                <div className="grid grid-cols-1 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">UV Radiation Simulator</span>
                      <span className="text-neon-pink font-mono">{uvSim} Index</span>
                    </div>
                    <input 
                      type="range" min="0" max="15" 
                      value={uvSim} onChange={(e) => setUvSim(Number(e.target.value))}
                      className="w-full accent-neon-pink"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                    <span className="text-xs text-gray-400">Soil Moisture Mode</span>
                    <select 
                      value={soilSim} onChange={(e) => setSoilSim(e.target.value)}
                      className="bg-[#0d1222] border border-white/10 text-white text-xs p-1.5 rounded-lg focus:outline-none focus:border-neon-pink"
                    >
                      <option value="drought">Drought (Low)</option>
                      <option value="normal">Normal</option>
                      <option value="flood">Flood (High)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                    <span className="text-xs text-gray-400">Hardware Status</span>
                    <button 
                      onClick={() => setSensorFaultSim(!sensorFaultSim)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-mono ${sensorFaultSim ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}
                    >
                      {sensorFaultSim ? '🔴 FAULT INJECTED' : '🟢 OPERATIONAL'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-white mb-2 font-display">Platform-Wide Dispatcher</h4>
                <form onSubmit={handleCustomBroadcast} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Custom Title (e.g. Acid Rain Alert)"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="px-3 py-2 bg-white/5 border border-white/10 focus:border-neon-pink focus:outline-none text-white rounded-xl text-xs"
                    />
                    <select
                      value={customSeverity}
                      onChange={(e) => setCustomSeverity(e.target.value)}
                      className="px-3 py-2 bg-[#0d1222] border border-white/10 focus:border-neon-pink focus:outline-none text-white rounded-xl text-xs font-mono"
                    >
                      <option value="critical">🔴 Critical Alert</option>
                      <option value="warning">🟡 Warning Advisory</option>
                      <option value="info">🔵 General Info</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1">
                    <input
                      type="text"
                      placeholder="Target City (Optional, e.g. Paris)"
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="px-3 py-2 bg-white/5 border border-white/10 focus:border-neon-pink focus:outline-none text-white rounded-xl text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Type message to broadcast to all active users..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 focus:border-neon-pink focus:outline-none text-white rounded-xl text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neon-pink text-white text-xs font-bold rounded-xl hover:shadow-neon-pink/20 transition-all font-mono"
                    >
                      DISPATCH
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>

        </>)}{/* end dashboard tab */}

      </div>

      {/* Slide-in Simulation Overlay alerts */}
      <AnimatePresence>
        {simulatedAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 max-w-sm w-full p-4 rounded-2xl border backdrop-blur-md shadow-2xl z-[100] flex items-start gap-3 ${simulatedAlert.color}`}
          >
            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs uppercase tracking-wider font-mono">{simulatedAlert.title}</h4>
              <p className="text-white text-xs mt-1 leading-normal font-sans">{simulatedAlert.text}</p>
            </div>
            <button
              onClick={() => setSimulatedAlert(null)}
              className="text-[10px] font-mono opacity-60 hover:opacity-100 text-white"
            >
              DISMISS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
