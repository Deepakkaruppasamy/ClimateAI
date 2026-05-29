import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Thermometer, Wind, Droplets, Eye, Sun, Cloud, 
  Activity, Zap, Brain, Shield, TrendingUp, ArrowUp,
  ArrowDown, Gauge, Sunset, Sunrise, CloudRain, Snowflake,
  RefreshCw, MapPin, Compass, ShieldAlert, Cpu
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useWeather } from '../context/WeatherContext'
import { useSocket } from '../context/SocketContext'
import WeatherParticles from '../components/hero/WeatherParticles'
import CitySearch from '../components/ui/CitySearch'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover } from '../utils/audio'

const DASHBOARD_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_102933_4e8f73b5-775a-4179-b2fb-472f59063dcd.mp4'

// ─── Custom Tooltip ─────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}{p.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Weather Icon ───────────────────────────────────────────
function getWeatherEmoji(code) {
  if (code === 0) return '☀️'
  if ([1, 2].includes(code)) return '⛅'
  if (code === 3) return '☁️'
  if ([45, 48].includes(code)) return '🌫️'
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️'
  if ([71, 73, 75].includes(code)) return '❄️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌤️'
}

// ─── Metric Card ────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, unit, sub, color, accentClass, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-5 card-hover relative overflow-hidden ${accentClass}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold font-outfit text-white">
          {value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  )
}

// ─── AQI Bar ────────────────────────────────────────────────
function AQIBar({ value, max = 500 }) {
  const pct = (value / max) * 100
  const color = value < 50 ? '#06ffd4' : value < 100 ? '#ffcc00' : value < 150 ? '#ff8800' : '#ff4444'
  const label = value < 50 ? 'Good' : value < 100 ? 'Moderate' : value < 150 ? 'Unhealthy' : 'Hazardous'
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-400">Air Quality Index</span>
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #06ffd4, ${color})` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-600">0</span>
        <span className="text-xl font-bold font-outfit" style={{ color }}>{value}</span>
        <span className="text-xs text-gray-600">500</span>
      </div>
    </div>
  )
}

// ─── Forecast Day ───────────────────────────────────────────
function ForecastDay({ date, code, maxTemp, minTemp, precip, index }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const d = new Date(date)
  const label = index === 0 ? 'Today' : days[d.getDay()]
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass rounded-xl p-3 text-center card-hover flex flex-col items-center gap-2 min-w-[80px]"
    >
      <div className="text-xs text-gray-400 font-medium">{label}</div>
      <div className="text-2xl">{getWeatherEmoji(code)}</div>
      <div className="text-sm font-bold text-white">{maxTemp}°</div>
      <div className="text-xs text-gray-500">{minTemp}°</div>
      {precip > 0 && (
        <div className="flex items-center gap-1 text-xs text-neon-blue">
          <CloudRain size={10} /> {precip}mm
        </div>
      )}
    </motion.div>
  )
}

// ─── AI Recommendations ─────────────────────────────────────
function AIRecommendations({ weather }) {
  const getRecommendations = () => {
    if (!weather) return []
    const recs = []
    if (weather.temp > 30) recs.push({ emoji: '👕', text: 'Wear light, breathable clothing. Stay hydrated.', type: 'clothing' })
    else if (weather.temp < 10) recs.push({ emoji: '🧥', text: 'Dress in warm layers. Gloves and hat recommended.', type: 'clothing' })
    else recs.push({ emoji: '👔', text: 'Light jacket or casual wear is perfect today.', type: 'clothing' })
    
    if (weather.uvIndex >= 6) recs.push({ emoji: '🧴', text: 'High UV! Apply SPF 50+ sunscreen. Seek shade 11am-3pm.', type: 'health' })
    if (weather.windSpeed > 40) recs.push({ emoji: '✈️', text: 'Strong winds may cause travel delays. Check flight status.', type: 'travel' })
    if (weather.code >= 61 && weather.code <= 82) recs.push({ emoji: '🌂', text: 'Carry an umbrella. Road conditions may be slippery.', type: 'travel' })
    recs.push({ emoji: '🌱', text: 'Good conditions for outdoor farming activities today.', type: 'farming' })
    return recs.slice(0, 4)
  }

  const recs = getRecommendations()
  const colors = { clothing: '#00d4ff', health: '#06ffd4', travel: '#7c3aed', farming: '#22c55e' }

  return (
    <div className="space-y-3">
      {recs.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-3 glass rounded-xl p-3"
        >
          <span className="text-xl mt-0.5">{r.emoji}</span>
          <div>
            <div className="text-xs font-mono mb-0.5" style={{ color: colors[r.type] || '#00d4ff' }}>
              {r.type.toUpperCase()}
            </div>
            <div className="text-sm text-gray-300">{r.text}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const { weather, forecast, aqi, loading, location, fetchWeather } = useWeather()
  const { iotSimulationData } = useSocket()
  
  // Dashboard Sub-navigation tabs: metrics overview vs. interactive neural vortex simulator
  const [activeTab, setActiveTab] = useState('metrics') // 'metrics' | 'vortex'

  // Neural Vortex Simulator controls state variables
  const [vortexEnergy, setVortexEnergy] = useState(65) // range 10-120
  const [vortexRadius, setVortexRadius] = useState(220) // range 60-400
  const [vortexFuel, setVortexFuel] = useState(1.1) // range 0.5-3.0 (RCP temperature multiplier)

  const canvasRef = useRef(null)
  const isDragging = useRef(false)
  const vortexCoord = useRef({ x: 0, y: 0 })
  const synthRef = useRef({ audioCtx: null, osc: null, filter: null, gain: null })

  // Initialize Web Audio Synth for interactive storm draft wind hums
  const startSynth = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(60, ctx.currentTime) // low sub-bass baseline
      
      filter.type = 'bandpass'
      filter.Q.setValueAtTime(7, ctx.currentTime)
      filter.frequency.setValueAtTime(300, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      
      synthRef.current = { audioCtx: ctx, osc, filter, gain }
    } catch (e) {
      console.warn('Audio storm synthesizer setup failed:', e)
    }
  }

  const stopSynth = () => {
    const s = synthRef.current
    if (s.osc) {
      try { s.osc.stop() } catch (e) {}
    }
    if (s.audioCtx) {
      try { s.audioCtx.close() } catch (e) {}
    }
    synthRef.current = { audioCtx: null, osc: null, filter: null, gain: null }
  }

  // Update dynamic frequency filter & volume bounds based on interactive controls
  const updateSynthParams = (energy, fuel) => {
    const s = synthRef.current
    if (!s.audioCtx) return
    try {
      const now = s.audioCtx.currentTime
      // Frequency sweep coordinates with energy setting
      const sweep = 180 + energy * 4.2 + Math.sin(performance.now() * 0.006) * 15
      s.filter.frequency.setTargetAtTime(sweep, now, 0.12)
      
      // Volume ramps comfortably inline with storm velocity energy
      const volume = Math.min(0.09, 0.003 + (energy / 120) * 0.065)
      s.gain.gain.setTargetAtTime(volume, now, 0.18)
    } catch (e) {}
  }

  // Atmospheric Radar Fluid particles simulation loop
  useEffect(() => {
    if (activeTab !== 'vortex') {
      stopSynth()
      return
    }

    startSynth()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.getBoundingClientRect().width
      canvas.height = canvas.getBoundingClientRect().height
      // Center default vortex coordinates initially
      vortexCoord.current = { x: canvas.width / 2, y: canvas.height / 2 }
    }
    resize()
    window.addEventListener('resize', resize)

    // Particle vector instances
    const particles = []
    for (let i = 0; i < 550; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 300
      particles.push({
        x: vortexCoord.current.x + Math.cos(angle) * dist,
        y: vortexCoord.current.y + Math.sin(angle) * dist,
        size: 0.8 + Math.random() * 1.8,
        speedFactor: 0.5 + Math.random() * 0.8,
        angleOffset: Math.random() * Math.PI
      })
    }

    let frameId
    const loop = () => {
      if (!ctx || !canvas) return

      // Dynamic custom tailing fade creates beautiful neon trailing sweeps
      ctx.fillStyle = 'rgba(2, 4, 9, 0.12)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw radar scope concentric compass grids
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const maxScope = Math.min(canvas.width, canvas.height) * 0.45
      
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)'
      ctx.lineWidth = 1
      for (let r = 80; r <= maxScope; r += 80) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw sweeping HUD crosshair lines
      ctx.beginPath()
      ctx.moveTo(cx - maxScope, cy)
      ctx.lineTo(cx + maxScope, cy)
      ctx.moveTo(cx, cy - maxScope)
      ctx.lineTo(cx, cy + maxScope)
      ctx.stroke()

      // Calculate particle trajectories circling the active vortex center
      const targetV = vortexCoord.current
      const energy = vortexEnergy
      const radius = vortexRadius
      const fuel = vortexFuel

      // Adjust wind synthesizers params dynamically in loop
      updateSynthParams(energy, fuel)

      particles.forEach(p => {
        const dx = targetV.x - p.x
        const dy = targetV.y - p.y
        const dist = Math.hypot(dx, dy)

        // Orbital circular velocities
        const swirlStr = Math.max(0.05, (1 - dist / radius) * (energy * 0.05))
        const orbitalAngle = Math.atan2(dy, dx) + Math.PI / 2 + 0.015

        if (dist < radius) {
          // Circular orbital sweep
          p.x += Math.cos(orbitalAngle) * swirlStr * p.speedFactor
          p.y += Math.sin(orbitalAngle) * swirlStr * p.speedFactor
          
          // Gentle pull to storm eye center
          p.x += (dx / dist) * (swirlStr * 0.18)
          p.y += (dy / dist) * (swirlStr * 0.18)
        } else {
          // Drifts casually outside reach
          p.x += Math.sin(performance.now() * 0.001 + p.angleOffset) * 0.4
          p.y += Math.cos(performance.now() * 0.001 + p.angleOffset) * 0.4
        }

        // Particle colors shift dynamically depending on RCP temperature multiplier
        let fill = 'rgba(0, 212, 255, 0.75)' // neon cyan (temperate/cool)
        if (fuel > 2.0) {
          fill = `rgba(255, 0, 144, ${0.45 + Math.random() * 0.4})` // critical hot neon pink
        } else if (fuel > 1.3) {
          fill = 'rgba(124, 58, 237, 0.8)' // moderate violet
        } else if (fuel < 0.7) {
          fill = 'rgba(6, 255, 212, 0.8)' // arctic cyan-green
        }

        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Teleport back out to outer scope if sucked inside the storm eye
        if (dist < 10) {
          const spawnAngle = Math.random() * Math.PI * 2
          const spawnDist = radius * 0.6 + Math.random() * (radius * 0.4)
          p.x = targetV.x + Math.cos(spawnAngle) * spawnDist
          p.y = targetV.y + Math.sin(spawnAngle) * spawnDist
        }
      })

      // Draw neon core indicator glow on the vortex eye itself
      ctx.fillStyle = fuel > 2.0 
        ? 'rgba(255, 0, 144, 0.18)' 
        : fuel > 1.3 
        ? 'rgba(124, 58, 237, 0.15)' 
        : 'rgba(0, 212, 255, 0.15)'
      ctx.beginPath()
      ctx.arc(targetV.x, targetV.y, 45, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(targetV.x, targetV.y, 2, 0, Math.PI * 2)
      ctx.fill()

      frameId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      stopSynth()
    }
  }, [activeTab, vortexEnergy, vortexRadius, vortexFuel])

  // Canvas Mouse down dragging coordinates check
  const handleCanvasMouseDown = (e) => {
    isDragging.current = true
    const rect = canvasRef.current.getBoundingClientRect()
    vortexCoord.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    playTap()
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    vortexCoord.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    if (Math.random() > 0.85) playHover() // soft ticks while dragging storm vortex
  }

  const handleCanvasMouseUp = () => {
    isDragging.current = false
  }

  // IoT overrides applied if admin is simulating
  const uvDisplay = iotSimulationData ? iotSimulationData.uv : (weather?.uvIndex ?? '--')
  const uvRisk = uvDisplay >= 11 ? 'Extreme' : uvDisplay >= 8 ? 'Very High' : uvDisplay >= 6 ? 'High' : uvDisplay >= 3 ? 'Moderate' : 'Low'
  const soilDisplay = iotSimulationData?.soil || 'normal'
  const sensorFault = iotSimulationData?.fault || false

  // Generate hourly temp data for chart
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temp: (weather?.temp || 22) + Math.sin((i / 24) * Math.PI * 2) * 5 + (Math.random() - 0.5) * 2,
    humidity: (weather?.humidity || 60) + (Math.random() - 0.5) * 10,
    wind: (weather?.windSpeed || 15) + (Math.random() - 0.5) * 8,
  }))

  const weeklyData = forecast.slice(0, 7).map(d => ({
    day: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    max: d.maxTemp,
    min: d.minTemp,
    precip: d.precip,
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="loading-ring mx-auto mb-4" />
          <div className="text-gray-400 font-mono text-sm">Fetching climate data...</div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 pb-12 relative"
    >
      {/* Cinematic video background — subtle dark overlay */}
      <VideoBackground
        src={DASHBOARD_VIDEO}
        overlay="dark"
        kenBurns={true}
        grain={true}
        scanlines={false}
      />
      <WeatherParticles />
      <div className="absolute inset-0 bg-animated-grid opacity-15 pointer-events-none z-[3]" />

      {/* Sensor fault glitch overlay */}
      {sensorFault && (
        <div className="fixed inset-0 z-[50] pointer-events-none">
          <div className="absolute inset-0 border-2 border-red-500/50 animate-pulse" />
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 backdrop-blur-md px-4 py-2 rounded-xl text-red-400 text-xs font-mono font-bold uppercase tracking-widest">
            ⚠ SENSOR FAULT DETECTED — READINGS UNRELIABLE
          </div>
        </div>
      )}

      {/* IoT Simulation banner */}
      {iotSimulationData && (
        <div className="fixed bottom-6 right-6 z-[50] glass border border-neon-pink/30 px-4 py-2 rounded-xl text-xs font-mono text-neon-pink">
          🎛️ ADMIN SIMULATION ACTIVE · UV:{iotSimulationData.uv} · SOIL:{iotSimulationData.soil.toUpperCase()} · {sensorFault ? 'FAULT' : 'OK'}
        </div>
      )}

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-[10]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-neon-blue" />
              <span className="text-sm text-gray-400">{location.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              <span className="label-overline">Live</span>
            </div>
            <h1 className="text-white" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>
              Weather{' '}
              <em style={{ fontStyle: 'italic', color: '#00d4ff' }}>Dashboard</em>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <CitySearch />
            <div className="glass rounded-xl px-4 py-2 text-sm text-gray-400 font-mono hidden xl:block">
              {new Date().toLocaleString()}
            </div>
            <button
              onClick={() => fetchWeather(location.lat, location.lon)}
              className="glass p-2 rounded-xl hover:neon-border-blue transition-all"
              title="Refresh weather data"
            >
              <RefreshCw size={16} className="text-neon-blue" />
            </button>
          </div>
        </div>

        {/* Current Weather Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8 mb-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10"
            style={{ background: 'radial-gradient(ellipse at 80% 50%, #00d4ff, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-8xl">{getWeatherEmoji(weather?.code || 0)}</div>
              <div>
                <div className="text-7xl font-bold font-outfit gradient-text-blue-cyan leading-none">
                  {weather?.temp ?? '--'}°
                </div>
                <div className="text-xl text-gray-300 mt-1">{weather?.description}</div>
                <div className="text-sm text-gray-500 mt-0.5">Feels like {weather?.feelsLike}°C</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Droplets, label: 'Humidity', val: `${weather?.humidity}%`, color: '#00d4ff' },
                { icon: Wind, label: 'Wind', val: `${weather?.windSpeed} km/h`, color: '#7c3aed' },
                { icon: Gauge, label: 'Pressure', val: `${Math.round(weather?.pressure || 1013)} hPa`, color: '#06ffd4' },
                { icon: Sun, label: 'UV Index', val: `${weather?.uvIndex || 3}`, color: '#ffcc00' },
              ].map(({ icon: Icon, label, val, color }) => (
                <div key={label} className="glass rounded-xl p-3 text-center">
                  <Icon size={16} style={{ color }} className="mx-auto mb-1" />
                  <div className="text-lg font-bold text-white font-outfit">{val}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* HUD Sub-Navigation Tab selector to select visual modes */}
        <div className="flex gap-2.5 mb-6 border-b border-white/5 pb-4">
          <button
            onClick={() => { playTap(); setActiveTab('metrics') }}
            onMouseEnter={playHover}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all border ${
              activeTab === 'metrics'
                ? 'bg-neon-blue/15 border-neon-blue text-neon-blue font-bold shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                : 'glass border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📊 CLIMATE METRICS CONSOLE
          </button>
          <button
            onClick={() => { playTap(); setActiveTab('vortex') }}
            onMouseEnter={playHover}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all border relative overflow-hidden group ${
              activeTab === 'vortex'
                ? 'bg-neon-purple/15 border-neon-purple text-neon-purple font-bold shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                : 'glass border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="absolute top-0 right-0 bg-neon-cyan text-black text-[7px] font-mono px-1 font-extrabold uppercase animate-pulse select-none z-10">NEW</span>
            🌀 NEURAL VORTEX RADAR
          </button>
        </div>

        {/* ──────── TAB 1: METRICS OVERVIEW (Original Charts & Statistics) ──────── */}
        {activeTab === 'metrics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={Thermometer} label="Temperature" value={weather?.temp ?? '--'} unit="°C"
                sub={`Max ${forecast[0]?.maxTemp ?? '--'}° / Min ${forecast[0]?.minTemp ?? '--'}°`}
                color="#00d4ff" accentClass="stat-accent-blue" trend={2.3} />
              <MetricCard icon={Wind} label="Wind Speed" value={weather?.windSpeed ?? '--'} unit="km/h"
                sub={`Direction: ${weather?.windDir ?? '--'}°`}
                color="#7c3aed" accentClass="stat-accent-purple" trend={-5.1} />
              <MetricCard icon={Droplets} label="Humidity" value={weather?.humidity ?? '--'} unit="%"
                sub="Dew point: comfortable" color="#06ffd4" accentClass="stat-accent-cyan" trend={1.2} />
              <MetricCard icon={Sun} label={`UV Index${iotSimulationData ? ' (SIM)' : ''}`} value={uvDisplay} unit=""
                sub={`${uvRisk} risk${soilDisplay !== 'normal' ? ` · Soil: ${soilDisplay}` : ''}`}
                color={uvDisplay >= 6 ? '#ff4444' : '#ffcc00'} accentClass="stat-accent-pink" />
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Temperature Chart */}
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="heading-section text-lg text-white">24-Hour Temperature</h3>
                  <span className="text-xs font-mono text-neon-blue bg-neon-blue/10 px-2 py-1 rounded">°C</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="temp" stroke="#00d4ff" strokeWidth={2}
                      fill="url(#tempGrad)" name="Temp" unit="°C" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Wind & Humidity */}
              <div className="glass rounded-2xl p-6">
                <h3 className="heading-section text-lg text-white mb-6">Wind & Humidity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hourlyData.filter((_, i) => i % 3 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="wind" stroke="#7c3aed" strokeWidth={2} dot={false} name="Wind" unit=" km/h" />
                    <Line type="monotone" dataKey="humidity" stroke="#06ffd4" strokeWidth={2} dot={false} name="Humidity" unit="%" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Forecast + AQI + AI Recs */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Forecast */}
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h3 className="heading-section text-lg text-white mb-4">7-Day Forecast</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {forecast.map((d, i) => (
                    <ForecastDay key={d.date} {...d} index={i} />
                  ))}
                </div>
                {/* Weekly bar chart */}
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={weeklyData}>
                      <XAxis dataKey="day" stroke="#666" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#666" tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="max" fill="#00d4ff" fillOpacity={0.7} radius={[4,4,0,0]} name="Max" unit="°C" />
                      <Bar dataKey="min" fill="#7c3aed" fillOpacity={0.7} radius={[4,4,0,0]} name="Min" unit="°C" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AQI + Recommendations */}
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="heading-section text-lg text-white mb-4">Air Quality</h3>
                  {aqi ? (
                    <div className="space-y-4">
                      <AQIBar value={aqi.aqi} />
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {[
                          { label: 'PM2.5', val: `${aqi.pm25}μg` },
                          { label: 'PM10', val: `${aqi.pm10}μg` },
                          { label: 'O₃', val: `${aqi.o3}μg` },
                          { label: 'NO₂', val: `${aqi.no2}μg` },
                        ].map(({ label, val }) => (
                          <div key={label} className="glass rounded-xl p-2 text-center">
                            <div className="text-xs text-gray-500">{label}</div>
                            <div className="text-sm font-bold text-neon-cyan">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="skeleton h-32 rounded-xl" />
                  )}
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain size={16} className="text-neon-purple" />
                    <h3 className="heading-section text-lg text-white">AI Insights</h3>
                  </div>
                  <AIRecommendations weather={weather} />
                </div>
              </div>
            </div>

            {/* Sunrise/Sunset */}
            {forecast[0] && (
              <div className="glass rounded-2xl p-6">
                <h3 className="heading-section text-lg text-white mb-4">Sun Schedule</h3>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Sunrise size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Sunrise</div>
                      <div className="text-lg font-bold text-white">{forecast[0].sunrise?.split('T')[1]?.slice(0,5) || '06:15'}</div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-2 rounded-full bg-white/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #ff6b35, #ffcc00, #00d4ff)' }}
                      initial={{ width: '0%' }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '65%' }}>
                      <div className="w-4 h-4 rounded-full bg-yellow-400 -translate-x-1/2 shadow-lg" style={{ boxShadow: '0 0 10px #ffcc00' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm text-gray-400">Sunset</div>
                      <div className="text-lg font-bold text-white">{forecast[0].sunset?.split('T')[1]?.slice(0,5) || '19:42'}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Sunset size={20} className="text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ──────── TAB 2: NEURAL VORTEX RADAR (Interactive Canvas Simulator) ──────── */}
        {activeTab === 'vortex' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-12 gap-6 items-start"
          >
            {/* Holographic Radar Canvas Screen */}
            <div className="lg:col-span-8 glass-strong rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
              
              {/* Radar Decals */}
              <div className="absolute top-4 left-4 text-[9px] font-mono text-neon-purple tracking-widest pointer-events-none z-20 select-none">
                HOLOGRAM_SIMULATION // RADAR_SCOPE
              </div>
              <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-white/20 pointer-events-none z-20" />
              <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-white/20 pointer-events-none z-20" />
              <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-white/20 pointer-events-none z-20" />
              <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-white/20 pointer-events-none z-20" />

              {/* Real-time radar rotating scanner vector line overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 z-10">
                <div className="absolute inset-0 border-r border-neon-purple animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              {/* Dynamic canvas element */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="w-full h-[520px] cursor-crosshair"
              />
              
              <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-gray-500 backdrop-blur-md select-none">
                <span>INTERACTIVE_FEED: CLICK & DRAG TO DISPLACE VORTEX CONCURRENTLY</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" /> SYNTH_HUM: ACTIVE</span>
              </div>
            </div>

            {/* Radar controls and Diagnostic readings */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Sliders Tuning */}
              <div className="glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-5">
                <h3 className="text-xs font-mono text-neon-purple uppercase tracking-widest select-none flex items-center gap-1.5">
                  <Compass size={14} className="text-neon-purple" /> STORM_PARAMETER_TUNER
                </h3>

                {/* Energy slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 select-none">
                    <span>CONVECTIVE ENERGY (VELOCITY)</span>
                    <span className="text-neon-blue font-bold">{vortexEnergy} rad/s</span>
                  </div>
                  <input
                    type="range" min="10" max="120" step="2"
                    value={vortexEnergy}
                    onChange={(e) => {
                      setVortexEnergy(parseInt(e.target.value))
                      if (parseInt(e.target.value) % 10 === 0) playTap()
                    }}
                    className="w-full accent-neon-purple h-1.5 rounded-lg bg-white/5 cursor-pointer"
                  />
                </div>

                {/* Radius Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 select-none">
                    <span>VORTEX INFLUENCE RADIUS</span>
                    <span className="text-neon-cyan font-bold">{vortexRadius} px</span>
                  </div>
                  <input
                    type="range" min="60" max="400" step="5"
                    value={vortexRadius}
                    onChange={(e) => {
                      setVortexRadius(parseInt(e.target.value))
                      if (parseInt(e.target.value) % 20 === 0) playTap()
                    }}
                    className="w-full accent-neon-cyan h-1.5 rounded-lg bg-white/5 cursor-pointer"
                  />
                </div>

                {/* Temp Multiplier */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 select-none">
                    <span>THERMAL FUEL (RCP MULTIPLIER)</span>
                    <span className="text-neon-pink font-bold">{(vortexFuel).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range" min="0.5" max="3.0" step="0.1"
                    value={vortexFuel}
                    onChange={(e) => {
                      setVortexFuel(parseFloat(e.target.value))
                      if (parseFloat(e.target.value) % 0.5 === 0) playTap()
                    }}
                    className="w-full accent-neon-pink h-1.5 rounded-lg bg-white/5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Diagnostics console readout */}
              <div className="glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
                <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest select-none flex items-center gap-1.5">
                  <Cpu size={14} className="text-gray-400" /> SIMULATOR_DIAGNOSTICS
                </h3>

                <div className="space-y-2 font-mono">
                  {/* Vortex diagnostics */}
                  {[
                    { label: 'SIMULATION HORIZON', val: vortexFuel > 2.0 ? 'RCP 8.5 (HIGH_ANOMALY)' : vortexFuel > 1.3 ? 'RCP 4.5 (MODERATE)' : 'RCP 2.6 (STABLE)', color: vortexFuel > 2.0 ? '#ff0090' : vortexFuel > 1.3 ? '#7c3aed' : '#06ffd4' },
                    { label: 'BAROMETRIC DEPRESSION', val: `${Math.round(1013 - (vortexEnergy * 0.7))} hPa`, color: '#ffffff' },
                    { label: 'INTEGRATED VORTICITY', val: `${(vortexEnergy * 1.45).toFixed(1)} rad/s`, color: '#ffffff' },
                    { label: 'SWIRL SHEAR FACTOR', val: vortexEnergy > 90 ? 'CRITICAL_SHEAR' : 'NORMAL_SHEAR', color: vortexEnergy > 90 ? '#ff0090' : '#06ffd4' },
                    { label: 'THERMAL FUEL SEEDING', val: vortexFuel > 1.8 ? 'HIGH_DENSITY' : 'STABLE_DENSITY', color: vortexFuel > 1.8 ? '#ff8800' : '#06ffd4' }
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex flex-col border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <span className="text-[8px] text-gray-500 uppercase">{label}</span>
                      <span className="text-xs font-bold mt-0.5" style={{ color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic threat alert status overlay card */}
              <AnimatePresence>
                {vortexEnergy > 85 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1.0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass rounded-3xl p-5 border border-red-500/20 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)] flex gap-3 items-start"
                  >
                    <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 font-mono">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider block">⚠ DANGER: VORTEX RUNAWAY THREAT</span>
                      <p className="text-[10px] text-gray-400 leading-normal font-light">
                        Convective energy levels exceed standard limits. Vortex shear spikes may introduce procedural math anomalies. Reduce velocity or fuel immediately.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  )
}
