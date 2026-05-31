import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, ShieldCheck, DollarSign, Activity, Users, 
  Flame, CloudRain, Wind, AlertTriangle, Play, RotateCcw, 
  Terminal, Shield, Compass, Radio 
} from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover } from '../utils/audio'

// Synthesis for authentic retro sci-fi sirens and telemetry sounds
const playSirenSound = (type = 'siren') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    if (type === 'siren') {
      // Pulsing alert siren
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      
      // Siren sweep
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.4)
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.8)
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } else if (type === 'beep') {
      // Sci-fi high-pitch telemetry beep
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } else if (type === 'action') {
      // Heavy dispatch bass sound
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    }
  } catch (e) {
    console.warn('Audio synthesis bypassed:', e)
  }
}

const SCENARIOS = [
  {
    id: 'hurricane',
    title: 'Category 5 Supercell: Hurricane Arthur',
    icon: Wind,
    description: 'A massive tropical vortex encroaching rapidly on a highly populated low-lying coastal boundary. High risk of storm surge flooding.',
    initialStats: { lives: 0, infra: 100, budget: 1000000, env: 80 },
    incidents: [
      { time: 5, text: '🌊 Storm surge breached sector C outer beach wall!', damage: 15, hazard: 'surge' },
      { time: 12, text: '🔌 Local electrical grid transformer short-circuited!', damage: 10, hazard: 'power' },
      { time: 20, text: '🏥 Metropolitan medical annex flooded! Emergency power required.', damage: 20, hazard: 'medical' },
      { time: 30, text: '🌊 High seawall barrier completely collapsed in commercial harbor!', damage: 25, hazard: 'harbor' }
    ]
  },
  {
    id: 'wildfire',
    title: 'Urban Boundary Firestorm: Sierra Cascade',
    icon: Flame,
    description: 'Dry Santa Ana wind drafts are feeding a fast-moving woodland brushfire pushing aggressively toward residential subdivisions.',
    initialStats: { lives: 0, infra: 100, budget: 900000, env: 90 },
    incidents: [
      { time: 5, text: '🔥 Crowning wildland fire jumped dry creek firebreak!', damage: 12, hazard: 'creek' },
      { time: 14, text: '💨 High carbon smog smoke choking main exit highway routing!', damage: 8, hazard: 'smoke' },
      { time: 22, text: '🔥 Secondary gas main line ignited in suburb sector F!', damage: 25, hazard: 'gas' },
      { time: 30, text: '🔥 Timber treatment processing yard engulfed in flames!', damage: 20, hazard: 'timber' }
    ]
  },
  {
    id: 'flood',
    title: 'High-Velocity Torrential River Surge',
    icon: CloudRain,
    description: 'Record atmospheric precipitation causing regional mountain runoff. Rivers are exceeding critical structural levels.',
    initialStats: { lives: 0, infra: 100, budget: 950000, env: 75 },
    incidents: [
      { time: 6, text: '🌧️ Heavy mountain mudslides blocking critical transport bridges!', damage: 15, hazard: 'mud' },
      { time: 13, text: '🌊 Reservoir levee recorded structural concrete cracking!', damage: 20, hazard: 'levee' },
      { time: 20, text: '🏙️ Water treatment plant pump failure! Fresh water contaminated.', damage: 15, hazard: 'water' },
      { time: 28, text: '🌊 Mountain reservoir spillway completely overflowed!', damage: 25, hazard: 'spillway' }
    ]
  }
]

export default function EmergencyCommand() {
  const [gameState, setGameState] = useState('lobby') // 'lobby' | 'active' | 'victory' | 'defeat'
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0])
  
  // Game states
  const [livesSaved, setLivesSaved] = useState(0)
  const [infraIntegrity, setInfraIntegrity] = useState(100)
  const [budget, setBudget] = useState(1000000)
  const [envSafety, setEnvSafety] = useState(80)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [logs, setLogs] = useState([])
  const [activeAlarms, setActiveAlarms] = useState([])
  
  // References
  const timerRef = useRef(null)

  // Start emergency simulation
  const handleStartGame = (scenario) => {
    playTap()
    playSirenSound('siren')
    setSelectedScenario(scenario)
    setLivesSaved(scenario.initialStats.lives)
    setInfraIntegrity(scenario.initialStats.infra)
    setBudget(scenario.initialStats.budget)
    setEnvSafety(scenario.initialStats.env)
    setSecondsElapsed(0)
    setLogs([`[00:00] 🚨 SYS_INIT: COMMAND CENTER ONLINE FOR ${scenario.title.toUpperCase()}`])
    setActiveAlarms([])
    setGameState('active')
  }

  // End game cleanly
  const stopGame = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // Game ticking hook
  useEffect(() => {
    if (gameState !== 'active') return
    
    timerRef.current = setInterval(() => {
      setSecondsElapsed(prev => {
        const nextTime = prev + 1
        
        // Incident matching
        const incident = selectedScenario.incidents.find(inc => inc.time === nextTime)
        if (incident) {
          playSirenSound('siren')
          setLogs(l => [`[00:${nextTime.toString().padStart(2, '0')}] ⚠️ ALARM: ${incident.text}`, ...l])
          setInfraIntegrity(inf => Math.max(0, inf - incident.damage))
          setEnvSafety(env => Math.max(10, env - 8))
          setActiveAlarms(a => [...a, incident])
        }

        // Periodically tick safety down slowly if active alarms remain
        if (nextTime % 4 === 0) {
          setEnvSafety(env => Math.max(10, env - 2))
        }

        // Increment lives saved slowly over time if system is stable
        setLivesSaved(l => l + Math.round(Math.random() * 200 + 100))

        // Time limit victory condition (45 seconds survivability)
        if (nextTime >= 45) {
          stopGame()
          setGameState('victory')
          playSirenSound('beep')
        }

        return nextTime
      })
    }, 1000)

    return () => stopGame()
  }, [gameState, selectedScenario])

  // Monitor loss criteria
  useEffect(() => {
    if (gameState === 'active' && infraIntegrity <= 0) {
      stopGame()
      setGameState('defeat')
      setLogs(l => [`[FAIL] 🛑 SYSTEM COLLAPSED: INFRASTRUCTURE INTEGRITY REDUCED TO 0%`, ...l])
    }
  }, [infraIntegrity, gameState])

  // Responder Actions dispatches
  const dispatchAction = (actionName, cost, effect) => {
    if (budget < cost) {
      playSirenSound('beep')
      return
    }
    
    playSirenSound('action')
    setBudget(b => b - cost)
    setLogs(l => [`[00:${secondsElapsed.toString().padStart(2, '0')}] ⚡ DISPATCH: ${actionName} ($${cost.toLocaleString()})`, ...l])
    
    if (effect.infra) setInfraIntegrity(inf => Math.min(100, inf + effect.infra))
    if (effect.lives) setLivesSaved(lives => lives + effect.lives)
    if (effect.env) setEnvSafety(env => Math.min(100, env + effect.env))
    
    // Clear the oldest active alarm when deploying heavy responders
    if (effect.resolvesAlarm && activeAlarms.length > 0) {
      setActiveAlarms(alarms => alarms.slice(1))
      setLogs(l => [`[00:${secondsElapsed.toString().padStart(2, '0')}] ✅ RESOLVED: Core structural threat mitigated.`, ...l])
    }
  }

  const handleRestart = () => {
    playTap()
    setGameState('lobby')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16 relative overflow-hidden bg-[#010408]"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4"
        overlay="dark"
        grain={true}
      />

      {/* Cyber Grid pattern */}
      <div className="absolute inset-0 bg-animated-grid opacity-15 pointer-events-none z-[2]" />

      <div className="max-w-[95%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        
        {/* Head Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4">
          <div>
            <span className="label-overline mb-1 inline-block text-red-500 font-bold">[ DISASTER_SIMULATOR: LIVE_OPS ]</span>
            <h1 className="heading-display text-4xl text-white font-display font-light">
              Disaster <span className="text-red-500 font-bold">Command Center</span>
            </h1>
            <p className="text-gray-400 text-sm">Deploy emergency protocols under extreme weather scenarios.</p>
          </div>
          
          {gameState === 'active' && (
            <div className="mt-4 sm:mt-0 flex items-center gap-4 bg-red-950/20 border border-red-500/20 px-5 py-2.5 rounded-2xl animate-pulse">
              <Radio size={16} className="text-red-500 animate-spin" />
              <div className="font-mono text-xs">
                <div className="text-gray-400">OPERATION TIME</div>
                <div className="text-white font-bold text-sm">00:{secondsElapsed.toString().padStart(2, '0')} / 00:45</div>
              </div>
            </div>
          )}
        </div>

        {/* LOBBY / SCENARIO SELECTOR */}
        <AnimatePresence mode="wait">
          {gameState === 'lobby' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4"
            >
              {SCENARIOS.map((s, idx) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-strong rounded-3xl p-6 border border-white/10 flex flex-col justify-between hover:border-red-500/30 transition-all bg-black/40 group relative overflow-hidden"
                  >
                    {/* Glowing card base decals */}
                    <div className="absolute top-2.5 right-3 text-[8px] font-mono text-gray-600 tracking-wider">CRISIS_NODE // 0{idx + 1}</div>
                    
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Icon className="text-red-500" size={24} />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-white font-mono">{s.title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mt-2">{s.description}</p>
                      </div>

                      <div className="space-y-2 bg-black/30 p-4 rounded-2xl border border-white/5 font-mono text-[10px]">
                        <div className="flex justify-between"><span className="text-gray-500">INIT_BUDGET:</span><span className="text-white font-bold">${s.initialStats.budget.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">CRITICALITY:</span><span className="text-red-500 font-bold">LEVEL 5 / RED</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">ATMOSPHERE:</span><span className="text-neon-cyan">SCANNING...</span></div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartGame(s)}
                      onMouseEnter={playHover}
                      className="w-full mt-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play size={14} /> Launch Responder Console
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* SIMULATOR DASHBOARD (ACTIVE) */}
          {gameState === 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 pt-2"
            >
              
              {/* Emergency Status Meters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Lives Saved Meter */}
                <div className="glass rounded-3xl p-5 border border-white/10 bg-black/30 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                    <Users className="text-neon-cyan" size={20} />
                  </div>
                  <div className="font-mono">
                    <span className="text-[10px] text-gray-500 uppercase block">Lives Evacuated</span>
                    <span className="text-2xl font-bold text-white">{livesSaved.toLocaleString()}</span>
                  </div>
                </div>

                {/* Infrastructure Integrity Meter */}
                <div className="glass rounded-3xl p-5 border border-white/10 bg-black/30 space-y-2">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                      <Shield size={12} className="text-red-400" /> Infrastructure Integrity
                    </span>
                    <span className={`text-sm font-bold ${infraIntegrity > 50 ? 'text-green-400' : 'text-red-500'}`}>
                      {infraIntegrity}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${infraIntegrity > 50 ? 'bg-green-400' : 'bg-red-500'}`}
                      animate={{ width: `${infraIntegrity}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Tactical Operation Budget */}
                <div className="glass rounded-3xl p-5 border border-white/10 bg-black/30 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="text-yellow-400" size={20} />
                  </div>
                  <div className="font-mono">
                    <span className="text-[10px] text-gray-500 uppercase block">Remaining Funds</span>
                    <span className={`text-2xl font-bold ${budget > 200000 ? 'text-white' : 'text-red-400 animate-pulse'}`}>
                      ${budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Environmental Safety Index */}
                <div className="glass rounded-3xl p-5 border border-white/10 bg-black/30 space-y-2">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                      <Activity size={12} className="text-neon-purple animate-pulse" /> Environmental Safety
                    </span>
                    <span className="text-sm font-bold text-neon-purple">{envSafety}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-neon-purple"
                      animate={{ width: `${envSafety}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

              </div>

              {/* Main Panel Core Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Protocol Decision Panel (8 Columns) */}
                <div className="lg:col-span-8 glass-strong rounded-3xl p-6 border border-white/10 space-y-6 relative overflow-hidden bg-black/40">
                  {/* Holographic sweeps */}
                  <div className="absolute top-2.5 right-3 text-[8px] font-mono text-gray-600 tracking-wider">PROTOCOL_ENGINE // ONLINE</div>

                  <div className="border-b border-white/10 pb-3 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-red-500 animate-pulse" />
                    <h3 className="text-sm font-mono text-white uppercase tracking-wider">Disaster Protocol Directives</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono font-bold text-white uppercase">Deploy Air Evacuation Lift</span>
                          <span className="text-xs font-bold text-yellow-500 font-mono">$150,000</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Dispatches emergency air transports to rescue citizens from critical isolation boundaries.</p>
                      </div>
                      <button
                        onClick={() => dispatchAction('Air Evac Lift', 150000, { lives: 3500, env: 3 })}
                        disabled={budget < 150000}
                        className="py-2.5 rounded-xl bg-neon-cyan hover:bg-neon-blue text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        Dispatch Evac
                      </button>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono font-bold text-white uppercase">Reinforce Structural Barriers</span>
                          <span className="text-xs font-bold text-yellow-500 font-mono">$250,000</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Bolsters seawalls, levee systems, and firebreaks to secure key civil infrastructure.</p>
                      </div>
                      <button
                        onClick={() => dispatchAction('Structural Barriers', 250000, { infra: 30, resolvesAlarm: true })}
                        disabled={budget < 250000}
                        className="py-2.5 rounded-xl bg-neon-cyan hover:bg-neon-blue text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        Reinforce Walls
                      </button>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono font-bold text-white uppercase">Deploy IoT Sensor Drones</span>
                          <span className="text-xs font-bold text-yellow-500 font-mono">$75,000</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Launches telemetry scanning arrays to map environmental damage curves.</p>
                      </div>
                      <button
                        onClick={() => dispatchAction('Telemetry Drones', 75000, { env: 20, lives: 800 })}
                        disabled={budget < 75000}
                        className="py-2.5 rounded-xl bg-neon-cyan hover:bg-neon-blue text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        Deploy Drones
                      </button>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono font-bold text-white uppercase">Establish Community Shelters</span>
                          <span className="text-xs font-bold text-yellow-500 font-mono">$100,000</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Launches temporary relief spaces equipped with microgrid power storage systems.</p>
                      </div>
                      <button
                        onClick={() => dispatchAction('Community Shelters', 100000, { lives: 2500, infra: 8 })}
                        disabled={budget < 100000}
                        className="py-2.5 rounded-xl bg-neon-cyan hover:bg-neon-blue text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        Open Shelters
                      </button>
                    </motion.div>

                  </div>

                  {/* Active Alert Warning Feed */}
                  {activeAlarms.length > 0 && (
                    <motion.div 
                      initial={{ scale: 0.97, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3.5"
                    >
                      <AlertTriangle className="text-red-500 animate-bounce shrink-0" size={20} />
                      <div className="font-mono text-xs">
                        <span className="text-red-500 font-bold block mb-1">CRITICAL INCIDENT PROTOCOL ENGAGED</span>
                        <p className="text-gray-300 leading-relaxed">
                          {activeAlarms[0].text} Infrastructure is taking structural decay. 
                          Deploy <strong className="text-white">Reinforce Structural Barriers</strong> to mitigate and resolve immediately.
                        </p>
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Operations Terminal Logs (4 Columns) */}
                <div className="lg:col-span-4 glass-strong rounded-3xl p-5 border border-white/10 space-y-4 bg-black/50 h-[380px] flex flex-col justify-between">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <Terminal size={14} className="text-[#06ffd4]" />
                    <span className="text-xs font-mono text-white uppercase tracking-wider">Operations Telemetry Feed</span>
                  </div>

                  {/* Scrolling Feed logs */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[10px] font-mono leading-relaxed select-text">
                    {logs.map((log, idx) => {
                      const isAlert = log.includes('⚠️ ALARM:')
                      const isDispatch = log.includes('⚡ DISPATCH:')
                      const isResolved = log.includes('✅ RESOLVED:')
                      
                      return (
                        <div 
                          key={idx} 
                          className={`p-2 rounded-lg ${
                            isAlert ? 'border border-red-500/20 bg-red-950/25 text-red-400' :
                            isDispatch ? 'border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan' :
                            isResolved ? 'border border-green-500/20 bg-green-950/25 text-green-400' :
                            'text-gray-500'
                          }`}
                        >
                          {log}
                        </div>
                      )
                    })}
                  </div>

                  <div className="text-[9px] font-mono text-gray-600 border-t border-white/10 pt-2 text-center select-none">
                    DOPPLER_FLOW // FEED_STREAM: STABLE
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* SIMULATOR END RESULTS */}
          {(gameState === 'victory' || gameState === 'defeat') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto glass-strong rounded-3xl p-8 border border-white/10 bg-black/40 text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-3.5 right-4 text-[8px] font-mono text-gray-600 tracking-wider">COMMAND_REPORT // END_OPS</div>
              
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                {gameState === 'victory' ? (
                  <ShieldCheck size={32} className="text-green-400 animate-pulse" />
                ) : (
                  <ShieldAlert size={32} className="text-red-500 animate-pulse" />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-display font-light text-white">
                  {gameState === 'victory' ? (
                    <>Operation <span className="gradient-text font-bold">Successfully Resolved</span></>
                  ) : (
                    <>Operation <span className="text-red-500 font-bold">Collapse Recorded</span></>
                  )}
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                  {gameState === 'victory' 
                    ? `You successfully survived the maximum crisis telemetry cycle of Arthur and mitigated infrastructural damage with a stable lock.`
                    : `Civilian infrastructure collapsed under severe precipitation and flooding overload. Operation halted immediately.`
                  }
                </p>
              </div>

              {/* End Stats report */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/40 p-5 rounded-2xl border border-white/5 text-xs font-mono text-left max-w-md mx-auto">
                <div className="space-y-0.5">
                  <span className="text-gray-500 block text-[9px]">SAVED CITIZENS:</span>
                  <span className="text-white font-bold text-sm">+{livesSaved.toLocaleString()}</span>
                </div>
                
                <div className="space-y-0.5">
                  <span className="text-gray-500 block text-[9px]">INFRA INTEGRITY:</span>
                  <span className={`font-bold text-sm ${infraIntegrity > 50 ? 'text-green-400' : 'text-red-500'}`}>
                    {infraIntegrity}%
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-gray-500 block text-[9px]">REMAINING FUNDS:</span>
                  <span className="text-white font-bold text-sm">${budget.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                onMouseEnter={playHover}
                className="px-8 py-3 rounded-2xl bg-white hover:bg-neon-cyan text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <RotateCcw size={14} /> Back to Briefing Lobby
              </button>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  )
}
