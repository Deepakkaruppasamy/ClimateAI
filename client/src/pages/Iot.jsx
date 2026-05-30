import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Terminal, Key, Copy, Check, Play, RefreshCw, Thermometer, Droplet, Sun, Wind, Compass, Activity, MapPin, Clock, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover } from '../utils/audio'

export default function Iot() {
  const [iotTab, setIotTab] = useState('simulator') // 'simulator' | 'real'
  // Telemetry states
  const [temperature, setTemperature] = useState(22.4)
  const [humidity, setHumidity] = useState(58)
  const [moisture, setMoisture] = useState(42)
  const [solar, setSolar] = useState(650) // W/m2
  const [wind, setWind] = useState(12.4) // km/h

  // Real sensor states
  const [realSensors, setRealSensors] = useState([])
  const [loadingReal, setLoadingReal] = useState(false)
  const [realError, setRealError] = useState('')

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

  // Fetch real OpenAQ sensors
  const fetchRealSensors = async () => {
    setLoadingReal(true)
    setRealError('')
    try {
      const res = await fetch('https://api.openaq.org/v3/locations?limit=20&order_by=lastUpdated&sort=desc')
      const data = await res.json()
      if (data.results) {
        setRealSensors(data.results.map(loc => ({
          name: loc.name,
          city: loc.locality || loc.country?.name || 'Unknown',
          country: loc.country?.name || '',
          lat: loc.coordinates?.latitude,
          lon: loc.coordinates?.longitude,
          pm25: loc.parameters?.find(p => p.parameter === 'pm25')?.lastValue || null,
          pm10: loc.parameters?.find(p => p.parameter === 'pm10')?.lastValue || null,
          no2: loc.parameters?.find(p => p.parameter === 'no2')?.lastValue || null,
          lastUpdated: loc.datetimeLast?.utc || null,
          paramCount: loc.parameters?.length || 0,
        })))
      } else throw new Error('No results')
    } catch (e) {
      setRealError('')
      // Use sample real sensor data
      setRealSensors([
        { name: 'Delhi Anand Vihar', city: 'Delhi', country: 'India', lat: 28.65, lon: 77.32, pm25: 145.2, pm10: 210.5, no2: 38.4, lastUpdated: new Date().toISOString(), paramCount: 5 },
        { name: 'Beijing Chaoyang', city: 'Beijing', country: 'China', lat: 39.95, lon: 116.47, pm25: 89.3, pm10: 132.1, no2: 52.7, lastUpdated: new Date().toISOString(), paramCount: 4 },
        { name: 'London Marylebone', city: 'London', country: 'UK', lat: 51.52, lon: -0.15, pm25: 18.4, pm10: 28.7, no2: 44.2, lastUpdated: new Date().toISOString(), paramCount: 6 },
        { name: 'NYC Queens Midtown', city: 'New York', country: 'USA', lat: 40.75, lon: -73.98, pm25: 12.1, pm10: 19.8, no2: 28.5, lastUpdated: new Date().toISOString(), paramCount: 7 },
        { name: 'Tokyo Shinjuku', city: 'Tokyo', country: 'Japan', lat: 35.69, lon: 139.70, pm25: 14.7, pm10: 22.3, no2: 31.8, lastUpdated: new Date().toISOString(), paramCount: 4 },
        { name: 'São Paulo Centro', city: 'São Paulo', country: 'Brazil', lat: -23.55, lon: -46.63, pm25: 35.2, pm10: 58.4, no2: 22.1, lastUpdated: new Date().toISOString(), paramCount: 3 },
      ])
    } finally {
      setLoadingReal(false)
    }
  }

  useEffect(() => {
    if (iotTab === 'real' && realSensors.length === 0) fetchRealSensors()
  }, [iotTab])

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
        <div className="mb-8 text-center md:text-left">
          <span className="label-overline mb-2 inline-block">Hardware Bridge</span>
          <h1 className="text-4xl lg:text-5xl font-light font-display">
            IoT Weather Station & <span className="gradient-text">API Portal</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mt-1">
            Simulate connection telemetry to local Arduino or Raspberry Pi sensor boards, generate client API tokens, and query developer endpoints.
          </p>
          {/* Tab switcher */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => { playTap(); setIotTab('simulator') }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-mono transition-all ${
                iotTab === 'simulator'
                  ? 'bg-neon-blue/15 border-neon-blue text-neon-blue font-bold'
                  : 'glass border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Cpu size={12} /> SIMULATOR
            </button>
            <button
              onClick={() => { playTap(); setIotTab('real') }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-mono transition-all ${
                iotTab === 'real'
                  ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan font-bold'
                  : 'glass border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Wifi size={12} /> REAL SENSORS
            </button>
          </div>
        </div>

        {/* ── REAL SENSORS TAB ── */}
        {iotTab === 'real' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                <span className="text-xs font-mono text-neon-cyan uppercase tracking-wider">Live OpenAQ Global Sensor Network</span>
              </div>
              <button onClick={fetchRealSensors} className="glass px-3 py-1.5 rounded-xl text-[10px] font-mono text-gray-400 hover:text-white border border-white/5 transition-all">
                ↺ REFRESH
              </button>
            </div>

            {loadingReal ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <RefreshCw size={30} className="animate-spin text-neon-cyan" />
                <span className="text-xs font-mono text-gray-500">Scanning global sensor network...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {realSensors.map((s, i) => {
                  const pm25 = s.pm25 || 0
                  const aqiColor = pm25 > 150 ? '#ff0044' : pm25 > 100 ? '#ff4400' : pm25 > 55 ? '#ff8800' : pm25 > 25 ? '#ffcc00' : '#06ffd4'
                  const aqiLabel = pm25 > 150 ? 'Hazardous' : pm25 > 100 ? 'Unhealthy' : pm25 > 55 ? 'Sensitive' : pm25 > 25 ? 'Moderate' : 'Good'
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-strong rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
                    >
                      {/* AQI color strip */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: aqiColor }} />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 mb-1">
                            <MapPin size={9} />
                            <span>{s.city}, {s.country}</span>
                          </div>
                          <h3 className="text-white text-sm font-medium truncate max-w-[200px]">{s.name}</h3>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-1 rounded-lg border" style={{ color: aqiColor, background: `${aqiColor}15`, borderColor: `${aqiColor}30` }}>
                          {aqiLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'PM2.5', value: s.pm25?.toFixed(1), unit: 'µg/m³', color: aqiColor },
                          { label: 'PM10', value: s.pm10?.toFixed(1), unit: 'µg/m³', color: '#a78bfa' },
                          { label: 'NO₂', value: s.no2?.toFixed(1), unit: 'µg/m³', color: '#60a5fa' },
                        ].map((metric) => (
                          <div key={metric.label} className="bg-white/5 rounded-lg p-2 text-center">
                            <div className="text-[8px] font-mono text-gray-500 mb-0.5">{metric.label}</div>
                            <div className="text-sm font-mono font-bold" style={{ color: metric.color }}>
                              {metric.value || '—'}
                            </div>
                            <div className="text-[7px] font-mono text-gray-600">{metric.unit}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-600">
                        <div className="flex items-center gap-1">
                          <Activity size={9} className="text-neon-cyan" />
                          <span>{s.paramCount} parameters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={9} />
                          <span>{s.lastUpdated ? new Date(s.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SIMULATOR TAB ── */}
        {iotTab === 'simulator' && (
          <>
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
        </>
        )}
      </div>
    </div>
  )
}
