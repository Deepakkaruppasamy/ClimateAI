import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Wind, CloudLightning, Thermometer, Snowflake, Info, X, Bell, Plus, Loader2, BellRing, Trash2, Megaphone } from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import { useWeather } from '../context/WeatherContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { playTap, playHover, playAlarm } from '../utils/audio'

const ALERT_TYPES = {
  extreme_heat: { icon: Thermometer, color: '#ff4444', bg: 'rgba(255,68,68,0.1)', label: 'Extreme Heat', severity: 'critical' },
  storm: { icon: CloudLightning, color: '#ffcc00', bg: 'rgba(255,204,0,0.1)', label: 'Thunderstorm', severity: 'high' },
  high_wind: { icon: Wind, color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', label: 'High Wind', severity: 'moderate' },
  freeze: { icon: Snowflake, color: '#a5f3fc', bg: 'rgba(165,243,252,0.1)', label: 'Freeze Warning', severity: 'high' },
  advisory: { icon: Info, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', label: 'Weather Advisory', severity: 'low' },
  broadcast: { icon: Megaphone, color: '#ff0090', bg: 'rgba(255,0,144,0.1)', label: 'Admin Broadcast', severity: 'critical' },
}

function generateAlerts(weather) {
  const alerts = []
  if (!weather) return alerts
  
  if (weather.temp > 35) alerts.push({
    type: 'extreme_heat', id: 1,
    title: 'Extreme Heat Warning',
    msg: `Temperature has reached ${weather.temp}°C. Stay indoors during peak hours (11am–4pm). Drink plenty of water.`,
    issued: '08:00 AM', expires: '08:00 PM', area: 'Metropolitan Area',
    active: true,
  })
  if (weather.code >= 95) alerts.push({
    type: 'storm', id: 2,
    title: 'Severe Thunderstorm Warning',
    msg: 'Severe thunderstorms with dangerous lightning, heavy rain, and possible hail expected. Seek shelter immediately.',
    issued: '06:30 AM', expires: '02:00 PM', area: 'Regional',
    active: true,
  })
  if (weather.windSpeed > 50) alerts.push({
    type: 'high_wind', id: 3,
    title: 'High Wind Advisory',
    msg: `Wind speeds of ${weather.windSpeed} km/h recorded with gusts up to ${weather.windSpeed + 20} km/h. Secure outdoor objects.`,
    issued: '07:00 AM', expires: '06:00 PM', area: 'Coastal Regions',
    active: true,
  })
  alerts.push({
    type: 'advisory', id: 4,
    title: `UV Index Advisory — Level ${weather.uvIndex || 3}`,
    msg: `UV index reaching ${weather.uvIndex || 3} today. ${(weather.uvIndex || 3) >= 6 ? 'High risk — apply SPF 50+ sunscreen.' : 'Moderate risk — sunscreen recommended.'}`,
    issued: '06:00 AM', expires: '08:00 PM', area: 'All Regions',
    active: true,
  })

  return alerts
}

const severityColors = {
  critical: { ring: '#ff4444', label: 'CRITICAL', bg: 'rgba(255,68,68,0.08)' },
  high: { ring: '#ffcc00', label: 'HIGH', bg: 'rgba(255,204,0,0.08)' },
  moderate: { ring: '#ff8800', label: 'MODERATE', bg: 'rgba(255,136,0,0.08)' },
  low: { ring: '#7c3aed', label: 'ADVISORY', bg: 'rgba(124,58,237,0.08)' },
}

// ── Self-Contained micro-canvas particle engine ───────────
function AlertCardCanvas({ type }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    
    const resize = () => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    resize()
    window.addEventListener('resize', resize)

    let particles = []
    const count = type === 'extreme_heat' ? 12 : type === 'high_wind' ? 15 : type === 'storm' ? 5 : type === 'freeze' ? 15 : 8
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 300),
        y: Math.random() * (canvas.height || 150),
        vx: type === 'high_wind' ? (2.2 + Math.random() * 2.8) : type === 'freeze' ? (-0.6 + Math.random() * 1.2) : 0,
        vy: type === 'extreme_heat' ? (-0.45 - Math.random() * 0.65) : type === 'freeze' ? (0.6 + Math.random() * 1.2) : 0,
        size: type === 'freeze' ? (1.5 + Math.random() * 2.2) : (2.5 + Math.random() * 5.5),
        alpha: 0.15 + Math.random() * 0.35,
        angle: Math.random() * Math.PI * 2,
        va: 0.01 + Math.random() * 0.035,
        life: Math.random() * 80
      })
    }

    const render = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        ctx.save()
        
        if (type === 'extreme_heat') {
          p.y += p.vy
          p.x += Math.sin(p.angle) * 0.25
          p.angle += p.va
          if (p.y < -20) p.y = canvas.height + 20
          
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
          grad.addColorStop(0, `rgba(255, 68, 68, ${p.alpha * 0.38})`)
          grad.addColorStop(1, 'rgba(255, 68, 68, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
          ctx.fill()
        } 
        else if (type === 'high_wind') {
          p.x += p.vx
          if (p.x > canvas.width + 40) {
            p.x = -40
            p.y = Math.random() * canvas.height
          }
          ctx.strokeStyle = `rgba(0, 212, 255, ${p.alpha * 0.28})`
          ctx.lineWidth = 1.3
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.size * 9, p.y)
          ctx.stroke()
        } 
        else if (type === 'freeze') {
          p.y += p.vy
          p.x += p.vx
          p.angle += p.va
          if (p.y > canvas.height + 15) {
            p.y = -15
            p.x = Math.random() * canvas.width
          }
          
          ctx.strokeStyle = `rgba(165, 243, 252, ${p.alpha * 0.42})`
          ctx.lineWidth = 1
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          ctx.beginPath()
          for (let k = 0; k < 6; k++) {
            ctx.moveTo(0, 0)
            ctx.lineTo(0, p.size * 1.6)
            ctx.rotate(Math.PI / 3)
          }
          ctx.stroke()
        } 
        else if (type === 'storm') {
          p.life--
          if (p.life <= 0) {
            p.life = 40 + Math.random() * 90
            p.x = Math.random() * canvas.width
            
            ctx.strokeStyle = `rgba(255, 204, 0, ${0.45 + Math.random() * 0.45})`
            ctx.lineWidth = 1.4
            ctx.beginPath()
            ctx.moveTo(p.x, 0)
            
            let curX = p.x
            let curY = 0
            while (curY < canvas.height) {
              curX += -12 + Math.random() * 24
              curY += 8 + Math.random() * 22
              ctx.lineTo(curX, curY)
            }
            ctx.stroke()
          }
        } 
        else {
          p.y += -0.15
          if (p.y < -15) p.y = canvas.height + 15
          ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha * 0.22})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.restore()
      })

      animationId = requestAnimationFrame(render)
    }
    
    render()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [type])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

function AlertCard({ alert, onDismiss }) {
  const type = ALERT_TYPES[alert.type] || ALERT_TYPES.advisory
  const Icon = type.icon
  const sev = severityColors[type.severity] || severityColors.low

  // Trigger procedural audio beep alarm once on mount based on threat severity
  useEffect(() => {
    if (type.severity === 'critical') {
      playAlarm('critical')
    } else if (type.severity === 'high') {
      playAlarm('high')
    }
  }, [alert.id])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden relative group hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-shadow"
      style={{ background: sev.bg, border: `1px solid ${type.color}33` }}
      onMouseEnter={playHover}
    >
      {/* Dynamic atmospheric micro-canvas hazard backgrounds */}
      <AlertCardCanvas type={alert.type} />

      {type.severity === 'critical' && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-10" style={{ boxShadow: `0 0 0 1px ${type.color}44` }}>
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ boxShadow: [`0 0 0 0px ${type.color}60`, `0 0 0 8px transparent`] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      )}
      
      <div className="p-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: type.bg, border: `1px solid ${type.color}44` }}>
              <Icon size={22} style={{ color: type.color }} />
            </div>
            {type.severity === 'critical' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping" style={{ background: type.color }} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full mr-2 font-bold"
                  style={{ color: sev.ring, background: `${sev.ring}18`, border: `1px solid ${sev.ring}33` }}>
                  {sev.label}
                </span>
                <span className="text-xs text-gray-400">{type.label}</span>
              </div>
              <button 
                onClick={() => { playTap(); onDismiss(alert.id) }} 
                className="text-gray-500 hover:text-white transition-colors z-20"
              >
                <X size={16} />
              </button>
            </div>
            <h3 className="text-white font-semibold mt-2 mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{alert.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{alert.msg || alert.text}</p>
            {alert.area && (
              <div className="flex gap-4 mt-3 text-xs text-gray-500 font-mono">
                <span>📍 {alert.area}</span>
                {alert.issued && <span>🕐 Issued: {alert.issued}</span>}
                {alert.expires && <span>⏰ Expires: {alert.expires}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Alert history mock data
const alertHistory = [
  { date: '2026-05-25', type: 'High Wind Advisory', area: 'Coastal', status: 'expired' },
  { date: '2026-05-24', type: 'Heavy Rain Warning', area: 'Metro', status: 'expired' },
  { date: '2026-05-22', type: 'UV Advisory', area: 'All Regions', status: 'expired' },
  { date: '2026-05-20', type: 'Thunderstorm Warning', area: 'Northern', status: 'expired' },
  { date: '2026-05-18', type: 'Freeze Warning', area: 'Highland', status: 'expired' },
]

export default function Alerts() {
  const { weather } = useWeather()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [activeAlerts, setActiveAlerts] = useState([])
  const [broadcastAlerts, setBroadcastAlerts] = useState([])

  // Rules state
  const [rules, setRules] = useState([])
  const [loadingRules, setLoadingRules] = useState(true)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleCity, setRuleCity] = useState('')
  const [ruleMetric, setRuleMetric] = useState('temp')
  const [ruleCondition, setRuleCondition] = useState('greater')
  const [ruleValue, setRuleValue] = useState(35)
  const [submittingRule, setSubmittingRule] = useState(false)
  const [ruleError, setRuleError] = useState('')

  let broadcastIdRef = { current: 1000 }

  useEffect(() => {
    if (weather) {
      setActiveAlerts(generateAlerts(weather))
    }
  }, [weather])

  // Fetch user rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/alerts/rules')
        const data = await res.json()
        if (res.ok && data.rules) setRules(data.rules)
      } catch (e) {
        console.error('Failed to fetch rules:', e)
      } finally {
        setLoadingRules(false)
      }
    }
    fetchRules()
  }, [])

  // Socket: listen for admin broadcasts and periodic alert events
  useEffect(() => {
    if (!socket) return

    const onBroadcast = (alertData) => {
      const id = Date.now()
      const newAlert = {
        id,
        type: 'broadcast',
        title: alertData.title || 'Admin Broadcast',
        msg: alertData.text || alertData.message || '',
        area: alertData.targetCity || 'All Regions',
        issued: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        active: true,
      }
      setBroadcastAlerts(prev => [newAlert, ...prev])
      // Auto-remove after 30 seconds
      setTimeout(() => setBroadcastAlerts(prev => prev.filter(a => a.id !== id)), 30000)
    }

    const onAlertNew = (data) => {
      const id = Date.now()
      setBroadcastAlerts(prev => [{
        id,
        type: 'advisory',
        title: `System Alert: ${data.type?.toUpperCase()}`,
        msg: data.message || '',
        area: 'Auto-Generated',
        issued: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        active: true,
      }, ...prev].slice(0, 5))
    }

    socket.on('broadcast:alert', onBroadcast)
    socket.on('alert:new', onAlertNew)
    return () => {
      socket.off('broadcast:alert', onBroadcast)
      socket.off('alert:new', onAlertNew)
    }
  }, [socket])

  const dismiss = (id) => setActiveAlerts(prev => prev.filter(a => a.id !== id))
  const dismissBroadcast = (id) => setBroadcastAlerts(prev => prev.filter(a => a.id !== id))

  const handleAddRule = async (e) => {
    e.preventDefault()
    if (!ruleCity) return
    setSubmittingRule(true)
    setRuleError('')
    try {
      const res = await fetch('/api/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.googleId || 'user',
          city: ruleCity,
          metric: ruleMetric,
          condition: ruleCondition,
          value: parseFloat(ruleValue)
        })
      })
      const data = await res.json()
      if (res.ok && data.rule) {
        setRules(prev => [...prev, data.rule])
        setRuleCity('')
        setShowRuleForm(false)
      } else {
        setRuleError(data.error || 'Failed to create rule')
      }
    } catch {
      setRuleError('Network error')
    } finally {
      setSubmittingRule(false)
    }
  }

  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await fetch(`/api/alerts/rules/${ruleId}`, { method: 'DELETE' })
      if (res.ok) setRules(prev => prev.filter(r => (r.id || r._id) !== ruleId))
    } catch (e) {
      console.error('Rule delete failed:', e)
    }
  }

  const allActive = [...broadcastAlerts, ...activeAlerts]
  const criticalCount = allActive.filter(a => ALERT_TYPES[a.type]?.severity === 'critical').length
  const highCount = allActive.filter(a => ALERT_TYPES[a.type]?.severity === 'high').length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12 relative overflow-hidden"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_031045_0e1165dd-ab48-46e3-ad3d-5fe77f217647.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-15 pointer-events-none z-[3]" />
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-display text-3xl text-white">
              Disaster <span className="gradient-text">Alert System</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Real-time emergency weather monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)' }}
              >
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm text-red-400 font-medium">{criticalCount} Critical</span>
              </motion.div>
            )}
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <Bell size={14} className="text-neon-blue" />
              <span className="text-sm text-gray-300">{allActive.length} Active</span>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Alerts', val: allActive.length, color: '#ff4444' },
            { label: 'Critical', val: criticalCount, color: '#ff4444' },
            { label: 'High Severity', val: highCount, color: '#ffcc00' },
            { label: 'My Rules', val: rules.length, color: '#7c3aed' },
          ].map(({ label, val, color }) => (
            <div key={label} className="glass rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold font-outfit" style={{ color }}>{val}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Active Alerts */}
          <div className="lg:col-span-2 space-y-6">

            {/* Broadcast Banner — admin dispatched */}
            <AnimatePresence>
              {broadcastAlerts.length > 0 && broadcastAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} onDismiss={dismissBroadcast} />
              ))}
            </AnimatePresence>

            {/* Weather-generated alerts */}
            <div>
              <h2 className="heading-section text-xl text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Active Weather Alerts
              </h2>
              {activeAlerts.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Shield size={40} className="text-neon-cyan mx-auto mb-3 opacity-50" />
                  <div className="text-gray-400">No active weather alerts. All clear! ✅</div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-4">
                    {activeAlerts.map(alert => (
                      <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Alert History */}
            <div>
              <h2 className="heading-section text-xl text-white mb-4">Alert History</h2>
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                      {['Date', 'Alert Type', 'Affected Area', 'Status'].map(h => (
                        <th key={h} className="text-left px-6 py-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alertHistory.map((a, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-400">{a.date}</td>
                        <td className="px-6 py-4 text-white">{a.type}</td>
                        <td className="px-6 py-4 text-gray-400">{a.area}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                            {a.status.toUpperCase()}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right — Smart Rules */}
          <div className="space-y-6">
            {/* Add Rule */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-display font-normal">My Alert Rules</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Auto-trigger alerts by threshold</p>
                </div>
                <button
                  onClick={() => setShowRuleForm(v => !v)}
                  className="p-2 rounded-xl glass text-neon-blue hover:text-white transition-colors border border-neon-blue/20"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Rule Form */}
              <AnimatePresence>
                {showRuleForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddRule}
                    className="overflow-hidden space-y-3"
                  >
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={ruleCity}
                        onChange={e => setRuleCity(e.target.value)}
                        placeholder="Paris, New York..."
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 focus:border-neon-blue focus:outline-none text-white rounded-xl text-sm placeholder-gray-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Metric</label>
                        <select value={ruleMetric} onChange={e => setRuleMetric(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0d1222] border border-white/10 focus:border-neon-blue focus:outline-none text-white rounded-xl text-xs font-mono">
                          <option value="temp">Temp (°C)</option>
                          <option value="wind">Wind (km/h)</option>
                          <option value="uv">UV Index</option>
                          <option value="aqi">AQI Index</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Condition</label>
                        <select value={ruleCondition} onChange={e => setRuleCondition(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0d1222] border border-white/10 focus:border-neon-blue focus:outline-none text-white rounded-xl text-xs font-mono">
                          <option value="greater">Exceeds (&gt;)</option>
                          <option value="less">Below (&lt;)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Threshold Value: <span className="text-white">{ruleValue}</span></label>
                      <input type="range" min="0" max="200" step="1" value={ruleValue}
                        onChange={e => setRuleValue(e.target.value)}
                        className="w-full accent-neon-blue bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    {ruleError && <p className="text-[10px] text-red-400 font-mono">{ruleError}</p>}
                    <button
                      type="submit"
                      disabled={submittingRule}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neon-blue/15 hover:bg-neon-blue/25 border border-neon-blue/30 text-neon-blue rounded-xl text-xs font-mono transition-colors disabled:opacity-50"
                    >
                      {submittingRule ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {submittingRule ? 'Saving...' : 'Add Rule'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Rules List */}
              {loadingRules ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-500 font-mono">
                  <Loader2 size={12} className="animate-spin" />
                  Loading rules...
                </div>
              ) : rules.length === 0 ? (
                <p className="text-xs text-gray-600 font-mono text-center py-4">No rules configured yet.</p>
              ) : (
                <div className="space-y-2">
                  {rules.map(rule => (
                    <div key={rule.id || rule._id}
                      className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-1.5 text-neon-pink font-mono text-[10px] uppercase">
                          <BellRing size={10} />
                          <span>Active</span>
                        </div>
                        <p className="text-xs text-white mt-0.5">{rule.city}</p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {rule.metric} {rule.condition === 'greater' ? '>' : '<'} {rule.value}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id || rule._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
