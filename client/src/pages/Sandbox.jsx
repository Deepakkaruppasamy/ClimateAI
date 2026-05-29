import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Landmark, Compass, Thermometer, ShieldAlert, Cpu, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import VideoBackground from '../components/ui/VideoBackground'

export default function Sandbox() {
  const [year, setYear] = useState(2026)
  const [rcp, setRcp] = useState('rcp45') // rcp26 (net zero), rcp45 (moderate), rcp85 (high)
  
  // AI analysis states
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)

  // Math simulation formulas based on Year (y) and RCP scenario (r)
  const simulateClimate = (y, r) => {
    const baselineYear = 1850
    const diff = y - baselineYear
    
    let temp = 0
    let seaLevel = 0
    let ice = 8.5 // million km2
    let co2 = 280 // ppm

    // Historical (1850 - 2026)
    if (y <= 2026) {
      const factor = (y - baselineYear) / (2026 - baselineYear)
      temp = parseFloat((1.2 * factor + Math.sin(y / 7) * 0.05).toFixed(2))
      seaLevel = Math.round(20 * factor)
      ice = parseFloat((8.5 - 3.2 * factor).toFixed(2))
      co2 = Math.round(280 + 140 * factor)
    } else {
      // Future Projections (2027 - 2100)
      const historicalFactor = 1.0
      const histTemp = 1.2
      const histSea = 20
      const histIce = 5.3
      const histCo2 = 420

      const futDiff = y - 2026
      const futFactor = futDiff / (2100 - 2026)

      if (r === 'rcp26') {
        temp = parseFloat((histTemp + 0.3 * futFactor + Math.sin(y / 5) * 0.03).toFixed(2))
        seaLevel = Math.round(histSea + 20 * futFactor)
        ice = parseFloat((histIce - 1.2 * futFactor).toFixed(2))
        co2 = Math.round(histCo2 + 20 * futFactor - 15 * Math.pow(futFactor, 2))
      } else if (r === 'rcp45') {
        temp = parseFloat((histTemp + 1.3 * futFactor + Math.sin(y / 5) * 0.04).toFixed(2))
        seaLevel = Math.round(histSea + 40 * futFactor)
        ice = parseFloat((histIce - 3.1 * futFactor).toFixed(2))
        co2 = Math.round(histCo2 + 130 * futFactor)
      } else if (r === 'rcp85') {
        temp = parseFloat((histTemp + 3.6 * futFactor + Math.sin(y / 5) * 0.06).toFixed(2))
        seaLevel = Math.round(histSea + 80 * futFactor)
        ice = parseFloat((histIce - 5.2 * futFactor).toFixed(2))
        if (ice < 0.1) ice = 0.0 // Ice-free arctic
        co2 = Math.round(histCo2 + 520 * futFactor)
      }
    }

    return { temp, seaLevel, ice, co2 }
  }

  const { temp, seaLevel, ice, co2 } = simulateClimate(year, rcp)

  // Generate dataset for Recharts from 1850 up to selected year
  const getHistoricalDataset = () => {
    const data = []
    for (let y = 1850; y <= year; y += 10) {
      data.push({
        year: y,
        ...simulateClimate(y, rcp)
      })
    }
    // Add current year if not already multiple of 10
    if (year % 10 !== 0) {
      data.push({
        year,
        ...simulateClimate(year, rcp)
      })
    }
    return data
  }

  const chartData = getHistoricalDataset()

  // Dynamic AI call based on year and RCP scenario
  const fetchAiSimulation = async () => {
    setLoadingAi(true)
    setAiAnalysis('')
    
    const rcpText = rcp === 'rcp26' ? 'RCP 2.6 (Net Zero / Immediate Caps)' : rcp === 'rcp45' ? 'RCP 4.5 (Moderate Emissions / Stabilization)' : 'RCP 8.5 (High Emissions / Business As Usual)'

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are ClimateAI, a predictive environmental climate model agent. Provide a professional, concise summary of the ecological impacts in 2-3 sentences.'
            },
            {
              role: 'user',
              content: `Give a brief ecological report for the Year ${year} under the IPCC emission pathway ${rcpText}. Current simulated data shows: Temp anomaly +${temp}°C, Sea levels +${seaLevel}cm, Arctic Ice ${ice}M sq km, atmospheric CO2 ${co2} ppm.`
            }
          ]
        })
      })

      const data = await response.json()
      if (response.ok && data.reply) {
        setAiAnalysis(data.reply)
      } else {
        setAiAnalysis('Ecological simulation warning: Projections show high risk of crop failures, water scarcity, and severe shoreline erosion. High mitigation policies are recommended.')
      }
    } catch (e) {
      setAiAnalysis('Ecological simulation warning: Projections show high risk of crop failures, water scarcity, and severe shoreline erosion. High mitigation policies are recommended.')
    } finally {
      setLoadingAi(false)
    }
  }

  // Reload AI analysis when year or RCP changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAiSimulation()
    }, 1500) // Debounce requests to prevent spam
    return () => clearTimeout(delayDebounce)
  }, [year, rcp])

  // Live Canvas Carbon Bubble Visualizer
  useEffect(() => {
    const canvas = document.getElementById('sandbox-bubble-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    // Handle resize
    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // Particles array
    let particles = []

    // Helper to generate particles
    const createParticle = (yVal = height + 10) => {
      const size = Math.random() * 4 + 1.5
      // Determine color based on RCP scenario
      let color = 'rgba(6, 255, 212, 0.4)' // RCP 2.6
      let glow = 'rgba(6, 255, 212, 0.2)'
      if (rcp === 'rcp45') {
        color = 'rgba(255, 172, 0, 0.4)' // RCP 4.5
        glow = 'rgba(255, 172, 0, 0.2)'
      } else if (rcp === 'rcp85') {
        color = 'rgba(255, 0, 144, 0.5)' // RCP 8.5
        glow = 'rgba(255, 0, 144, 0.3)'
      }

      return {
        x: Math.random() * width,
        y: yVal,
        size,
        speed: (Math.random() * 0.6 + 0.3) * (1 + temp * 0.4), // speed scales with temp
        color,
        glow,
        angle: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 - 0.01
      }
    }

    // Pre-populate particles
    const targetCount = Math.floor(co2 / 6)
    for (let i = 0; i < targetCount; i++) {
      particles.push(createParticle(Math.random() * height))
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Keep target count updated in real-time
      const currentTargetCount = Math.min(150, Math.floor(co2 / 6))
      while (particles.length < currentTargetCount) {
        particles.push(createParticle())
      }
      while (particles.length > currentTargetCount) {
        particles.pop()
      }

      particles.forEach((p, idx) => {
        p.y -= p.speed
        p.angle += p.wobbleSpeed
        p.x += Math.sin(p.angle) * 0.15

        // Draw particle with glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.glow
        ctx.shadowBlur = p.size * 2
        ctx.fill()
        ctx.shadowBlur = 0 // reset shadow blur

        // Reset particle if it leaves the top screen
        if (p.y < -10) {
          particles[idx] = createParticle()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [co2, rcp, temp])


  const getRcpMetadata = () => {
    if (rcp === 'rcp26') return { label: 'Net Zero Pathway (RCP 2.6)', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', desc: 'Represents immediate, drastic cuts to greenhouse gases. Temp increase is capped close to 1.5°C.' }
    if (rcp === 'rcp45') return { label: 'Stabilization Pathway (RCP 4.5)', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', desc: 'Represents moderate climate policy caps where global emissions peak around 2040 and then decline.' }
    return { label: 'High Emissions Pathway (RCP 8.5)', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5', desc: 'Business-as-usual pathway with growing fossil fuel dependencies. Leads to extreme global anomalies.' }
  }

  const meta = getRcpMetadata()

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#070a13] text-white">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="label-overline mb-2 inline-block">Ecological Projections</span>
          <h1 className="text-4xl lg:text-5xl font-light font-display">
            Climate Projections <span className="gradient-text">Sandbox</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mt-1">
            Simulate and graph annual temperature anomalies, ocean displacements, and arctic ice levels based on IPCC emission pathways.
          </p>
        </div>

        {/* Projections Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'TEMP ANOMALY', value: `+${temp}°C`, sub: 'Above 1850 base', color: 'text-red-400' },
            { label: 'SEA LEVEL RISE', value: `+${seaLevel} cm`, sub: 'Mean shoreline rise', color: 'text-blue-400' },
            { label: 'ARCTIC ICE AREA', value: `${ice} M km²`, sub: 'September average', color: 'text-neon-cyan' },
            { label: 'CO2 CONCENTRATION', value: `${co2} ppm`, sub: 'Atmospheric ratio', color: 'text-neon-purple' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass p-5 rounded-2xl border border-white/5 shadow-xl text-center md:text-left"
            >
              <span className="text-[10px] font-mono text-gray-500 tracking-wider block">{item.label}</span>
              <span className={`text-3xl font-semibold font-mono block mt-2 ${item.color}`}>{item.value}</span>
              <span className="text-[10px] text-gray-400 font-mono mt-1 block">{item.sub}</span>
            </motion.div>
          ))}
        </div>

        {/* Sandbox Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Projections Graphs */}
          <div className="xl:col-span-8 space-y-6">
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg text-white font-normal font-display">Historical to Projection Trend</h3>
                
                {/* RCP Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 text-xs font-mono">
                  {[
                    { id: 'rcp26', label: 'RCP 2.6' },
                    { id: 'rcp45', label: 'RCP 4.5' },
                    { id: 'rcp85', label: 'RCP 8.5' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRcp(tab.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        rcp === tab.id 
                          ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/20' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-80 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="year" stroke="#4b5563" fontSize={10} fontFamily="JetBrains Mono" />
                    <YAxis stroke="#4b5563" fontSize={10} fontFamily="JetBrains Mono" />
                    <Tooltip 
                      contentStyle={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }}
                      labelStyle={{ fontFamily: 'JetBrains Mono', color: '#00d4ff' }}
                    />
                    <Line type="monotone" dataKey="temp" name="Temp Anomaly (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ice" name="Arctic Ice (M km²)" stroke="#06ffd4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline Slider */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center text-sm font-mono">
                <span className="text-gray-500">[1850]</span>
                <span className="text-neon-cyan font-semibold text-lg">{year}</span>
                <span className="text-gray-500">[2100]</span>
              </div>
              <input
                type="range"
                min="1850"
                max="2100"
                step="1"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full accent-neon-cyan bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Scenario Metadata Card */}
            <div className={`p-6 rounded-3xl border transition-all ${meta.border} ${meta.bg}`}>
              <h4 className={`text-base font-semibold font-mono ${meta.color}`}>{meta.label}</h4>
              <p className="text-xs text-gray-300 leading-relaxed mt-2">{meta.desc}</p>
            </div>

            {/* Interactive Telemetry Canvas */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 relative overflow-hidden h-48 shadow-2xl">
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">[ Live Carbon Telemetry ]</span>
                <h4 className="text-white text-sm font-semibold font-mono mt-1">Bubble Density: {co2} ppm</h4>
              </div>
              <canvas id="sandbox-bubble-canvas" className="absolute inset-0 w-full h-full pointer-events-none" />
            </div>

            {/* AI Predictions */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={16} className="text-neon-purple animate-pulse" />
                  <span className="text-xs font-mono text-gray-400">AI PREDICTIVE REPORT</span>
                </div>
                
                <h3 className="text-lg font-display text-white mb-2">Ecological Impact Assessment</h3>
                
                <AnimatePresence mode="wait">
                  {loadingAi ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500 text-xs font-mono"
                    >
                      <Loader2 size={24} className="animate-spin text-neon-blue" />
                      <span>Synthesizing RCP datasets...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-300 leading-relaxed font-mono"
                    >
                      {aiAnalysis}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>MODEL: Groq Llama 3.1</span>
                <span>STATE: Active</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
