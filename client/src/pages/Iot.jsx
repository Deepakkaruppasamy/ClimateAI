import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Terminal, Key, Copy, Check, Play, RefreshCw, Thermometer, Droplet, Sun, Wind, Compass } from 'lucide-react'
import toast from 'react-hot-toast'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover } from '../utils/audio'

export default function Iot() {
  // Telemetry states
  const [temperature, setTemperature] = useState(22.4)
  const [humidity, setHumidity] = useState(58)
  const [moisture, setMoisture] = useState(42)
  const [solar, setSolar] = useState(650) // W/m2
  const [wind, setWind] = useState(12.4) // km/h

  // API Key states
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(false)

  // API Terminal states
  const [terminalOutput, setTerminalOutput] = useState('// Click "SEND REQUEST" below to query the simulated hardware sensor api.')
  const [loadingRequest, setLoadingRequest] = useState(false)

  // Telemetry fluctuation simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(t => parseFloat((t + (Math.random() - 0.5) * 0.4).toFixed(1)))
      setHumidity(h => Math.max(30, Math.min(95, Math.round(h + (Math.random() - 0.5) * 2))))
      setMoisture(m => Math.max(10, Math.min(80, Math.round(m + (Math.random() - 0.5) * 1.5))))
      setSolar(s => Math.max(0, Math.min(1100, Math.round(s + (Math.random() - 0.5) * 10))))
      setWind(w => parseFloat(Math.max(0, Math.min(60, w + (Math.random() - 0.5) * 0.8)).toFixed(1)))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Generate API key
  const handleGenerateKey = () => {
    const randomHex = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('')
    const key = `sk_live_cl_${randomHex}`
    setApiKey(key)
    toast.success('Developer API Key generated!')
  }

  // Copy API key to clipboard
  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Test API endpoint
  const handleTestEndpoint = () => {
    if (loadingRequest) return
    playTap()
    setLoadingRequest(true)
    setTerminalOutput('CONNECTING TO SIMULATED HARDWARE OVERLAY...\nAUTHENTICATING DEVICE BRIDGE...\n')
    
    setTimeout(() => {
      const responsePayload = {
        status: 'online',
        deviceId: 'iot_ws_node_9a12',
        timestamp: new Date().toISOString(),
        telemetry: {
          temperature_celsius: temperature,
          relative_humidity_percentage: humidity,
          soil_moisture_percentage: moisture,
          solar_radiation_watts_sq_meter: solar,
          wind_velocity_km_h: wind
        },
        authorization: apiKey ? 'authorized' : 'anonymous_fallback'
      }
      
      const jsonString = JSON.stringify(responsePayload, null, 2)
      let idx = 0
      setTerminalOutput('')
      
      const typeInterval = setInterval(() => {
        if (idx >= jsonString.length) {
          clearInterval(typeInterval)
          setLoadingRequest(false)
          return
        }
        
        setTerminalOutput(prev => prev + jsonString[idx])
        if (Math.random() >= 0.75) {
          playHover()
        }
        idx++
      }, 6)
    }, 1100)
  }

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
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="label-overline mb-2 inline-block">Hardware Bridge</span>
          <h1 className="text-4xl lg:text-5xl font-light font-display">
            IoT Weather Station & <span className="gradient-text">API Portal</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mt-1">
            Simulate connection telemetry to local Arduino or Raspberry Pi sensor boards, generate client API tokens, and query developer endpoints.
          </p>
        </div>

        {/* Live Telemetry Sensors */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Air Temp', value: `${temperature}°C`, icon: Thermometer, color: 'text-red-400', glow: 'shadow-red-500/5 border-red-500/10' },
            { label: 'Humidity', value: `${humidity}%`, icon: Droplet, color: 'text-blue-400', glow: 'shadow-blue-500/5 border-blue-500/10' },
            { label: 'Soil Moisture', value: `${moisture}%`, icon: Droplet, color: 'text-emerald-400', glow: 'shadow-emerald-500/5 border-emerald-500/10' },
            { label: 'Solar Index', value: `${solar} W/m²`, icon: Sun, color: 'text-yellow-400', glow: 'shadow-yellow-500/5 border-yellow-500/10' },
            { label: 'Wind Velocity', value: `${wind} km/h`, icon: Wind, color: 'text-purple-400', glow: 'shadow-purple-500/5 border-purple-500/10' }
          ].map((sensor) => {
            const Icon = sensor.icon
            return (
              <motion.div
                key={sensor.label}
                layout
                className={`glass p-5 rounded-2xl border flex flex-col justify-between items-center text-center shadow-lg transition-all ${sensor.glow}`}
              >
                <div className={`p-3 bg-white/5 rounded-xl ${sensor.color} mb-3`}>
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-500 tracking-wider block">{sensor.label}</span>
                  <span className="text-2xl font-mono font-semibold text-white block mt-1">{sensor.value}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Key Generator Portal */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* Live Wind Vector Compass Dial */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative flex flex-col items-center justify-between text-center min-h-[260px] overflow-hidden">
              <div className="absolute inset-0 bg-animated-grid opacity-[0.02] pointer-events-none" />
              <div className="absolute top-4 left-4 text-left pointer-events-none">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">[ Vector Compass ]</span>
                <h4 className="text-white text-sm font-semibold font-mono mt-0.5">Wind Heading Telemetry</h4>
              </div>
              
              <div className="relative w-32 h-32 mt-8 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3, 5" className="opacity-30" />
                </svg>
                <span className="absolute top-1 text-[8px] font-mono text-gray-600 font-bold">N</span>
                <span className="absolute right-1 text-[8px] font-mono text-gray-600 font-bold">E</span>
                <span className="absolute bottom-1 text-[8px] font-mono text-gray-600 font-bold">S</span>
                <span className="absolute left-1 text-[8px] font-mono text-gray-600 font-bold">W</span>
                
                {/* Wind needle */}
                <motion.div
                  className="w-1.5 h-20 bg-gradient-to-b from-neon-pink via-neon-purple to-transparent rounded-full"
                  style={{ originY: 0.5 }}
                  animate={{ rotate: wind * 18 }}
                  transition={{ type: 'spring', stiffness: 50, damping: 9 }}
                />
              </div>
              
              <div className="text-center mt-3">
                <span className="text-xs font-mono text-neon-pink font-bold">{wind} km/h</span>
                <span className="text-[9px] font-mono text-gray-500 block">HEADING: {Math.round((wind * 18) % 360)}° Vector</span>
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative space-y-6">
              <div>
                <h3 className="text-lg text-white font-normal font-display">Developer Credentials</h3>
                <p className="text-gray-400 text-xs mt-1">Generate a secure authorization key to authenticate API requests with the ClimateAI hardware portal.</p>
              </div>

              {apiKey ? (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Key size={14} className="text-neon-cyan flex-shrink-0" />
                    <span className="text-white truncate">{apiKey}</span>
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                  <span className="text-xs text-gray-500 font-mono">No active credentials detected</span>
                </div>
              )}

              <button
                onClick={handleGenerateKey}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl font-semibold shadow-lg hover:shadow-neon-blue/20 transition-all duration-300 active:scale-[0.98] text-sm"
              >
                <Key size={16} />
                <span>GENERATE API KEY</span>
              </button>
            </div>
          </div>

          {/* Swagger Testing Terminal */}
          <div className="xl:col-span-7">
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-neon-cyan animate-pulse" />
                  <h3 className="text-sm font-mono text-gray-400 font-normal">API SANDBOX BRIDGE</h3>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">POST</span>
                  <span>/api/weather/iot</span>
                </div>
              </div>

              {/* Console Output Screen */}
              <div className="w-full h-64 bg-[#040914] border border-white/5 rounded-2xl p-4 font-mono text-xs text-neon-cyan overflow-y-auto leading-relaxed shadow-inner">
                {loadingRequest && terminalOutput === 'CONNECTING TO SIMULATED HARDWARE OVERLAY...\nAUTHENTICATING DEVICE BRIDGE...\n' ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500">
                    <RefreshCw size={18} className="animate-spin text-neon-blue" />
                    <span>Executing HTTP query payload...</span>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{terminalOutput}<span className="animate-pulse text-neon-cyan select-none">█</span></pre>
                )}
              </div>

              {/* Execution trigger button */}
              <button
                onClick={handleTestEndpoint}
                disabled={loadingRequest}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 text-xs font-mono"
              >
                <Play size={12} className="fill-current text-white" />
                <span>SEND REQUEST</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
