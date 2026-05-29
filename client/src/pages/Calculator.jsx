import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Plane, Home, ShieldCheck, CreditCard, ChevronRight, ChevronLeft, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import confetti from 'canvas-confetti'
import { useAuth } from '../context/AuthContext'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover, playSuccess, playError } from '../utils/audio'

const OFFSET_PROJECTS = [
  { id: 'proj_reforest', name: 'Amazon Rainforest Protection', cost: 15, location: 'Brazil', desc: 'Prevents commercial deforestation and funds indigenous community guardians.' },
  { id: 'proj_wind', name: 'Sahara Wind Farm Array', cost: 12, location: 'Morocco', desc: 'Displaces coal-powered grid production by feeding 300MW of wind clean energy.' },
  { id: 'proj_capture', name: 'Direct Air Carbon Capture', cost: 25, location: 'Iceland', desc: 'Uses geothermal collectors to extract atmospheric carbon dioxide and mineralize it underground.' }
]

export default function Calculator() {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // 1: Home, 2: Transit, 3: Diet, 4: Results
  const [calculating, setCalculating] = useState(false)

  const saveFootprint = async (footprintVal) => {
    if (!user?._id) return
    try {
      await fetch(`/api/profile/${user._id}/footprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footprint: footprintVal })
      })
    } catch (err) {
      console.warn('Failed to save carbon footprint calculation:', err)
    }
  }

  const handleStepChange = (nextStep) => {
    playTap()
    setCalculating(true)
    setTimeout(() => {
      setStep(nextStep)
      setCalculating(false)
      if (nextStep === 4) {
        saveFootprint(total)
      }
    }, 550)
  }
  
  // Input states
  const [electricity, setElectricity] = useState(350) // kWh/month
  const [gas, setGas] = useState(50) // therms/month
  const [carMiles, setCarMiles] = useState(800) // miles/month
  const [carMpg, setCarMpg] = useState(25)
  const [flights, setFlights] = useState(3) // flights/year
  const [dietFactor, setDietFactor] = useState('average') // high, average, veggie, vegan
  
  // Checkout modal states
  const [activeProject, setActiveProject] = useState(null)
  const [cardNum, setCardNum] = useState('')
  const [cardName, setCardName] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Calculations
  const calculateEmissions = () => {
    // Emissions factors (metric tons CO2 per unit per year)
    const homeElectricCO2 = (electricity * 12 * 0.0004) // 0.4kg per kWh
    const homeGasCO2 = (gas * 12 * 0.0053) // 5.3kg per therm
    const transitCarCO2 = ((carMiles * 12) / carMpg) * 0.0089 // 8.9kg per gallon
    const transitFlightCO2 = flights * 0.9 // ~0.9 metric tons per flight
    
    let dietCO2 = 2.5 // default Average
    if (dietFactor === 'high') dietCO2 = 3.3
    if (dietFactor === 'veggie') dietCO2 = 1.7
    if (dietFactor === 'vegan') dietCO2 = 1.2

    const home = parseFloat((homeElectricCO2 + homeGasCO2).toFixed(1))
    const transit = parseFloat((transitCarCO2 + transitFlightCO2).toFixed(1))
    const diet = parseFloat(dietCO2.toFixed(1))
    const total = parseFloat((home + transit + diet).toFixed(1))

    return { home, transit, diet, total }
  }

  const { home, transit, diet, total } = calculateEmissions()

  const chartData = [
    { name: 'Household Energy', value: home, color: '#00d4ff' },
    { name: 'Transit & Flight', value: transit, color: '#7c3aed' },
    { name: 'Food & Lifestyle', value: diet, color: '#06ffd4' }
  ]

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    setPaying(true)
    setTimeout(async () => {
      setPaying(false)
      setPaymentSuccess(true)
      playSuccess()
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00d4ff', '#7c3aed', '#06ffd4']
      })
      // Submit carbon offset request to admin Carbon Audit panel
      try {
        await fetch('/api/carbon/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?._id || '507f1f77bcf86cd799439011', // valid Mongoose ObjectId fallback
            amount: total,
            projectId: activeProject?.id || 'PROJ-UNKNOWN'
          })
        })
      } catch (err) {
        console.warn('Carbon request submit failed:', err)
      }
    }, 2000)
  }

  const resetCalculator = () => {
    setElectricity(350)
    setGas(50)
    setCarMiles(800)
    setCarMpg(25)
    setFlights(3)
    setDietFactor('average')
    setStep(1)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#070a13] text-white">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_102933_4e8f73b5-775a-4179-b2fb-472f59063dcd.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="label-overline mb-2 inline-block">Sustainability Suite</span>
          <h1 className="text-4xl lg:text-5xl font-light font-display">
            Carbon Footprint <span className="gradient-text">Calculator</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mt-1">
            Audit your annualized carbon expenditures across home operations, transit systems, and diet habits, then fund carbon offsets to earn green badges.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Form Wizard / Results */}
          <div className="xl:col-span-7">
            <motion.div 
              layout
              className="glass-strong rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              {/* Active Step Glow Accent */}
              <div className="absolute -top-10 left-1/4 w-32 h-32 bg-neon-cyan/10 rounded-full blur-[40px] pointer-events-none" />
              
              {/* Holographic scanning laser sweep */}
              <AnimatePresence>
                {calculating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md z-45 flex flex-col items-center justify-center gap-3 animate-pulse"
                  >
                    <div className="absolute left-0 right-0 h-0.5 bg-neon-cyan/50 laser-sweep" />
                    <Sparkles className="text-neon-cyan animate-spin" size={24} />
                    <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">Scanning Telemetry...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 text-xs font-mono text-gray-500">
                <span className={step === 1 ? 'text-neon-cyan' : ''}>[01] HOUSEHOLD</span>
                <span className={step === 2 ? 'text-neon-cyan' : ''}>[02] TRANSIT</span>
                <span className={step === 3 ? 'text-neon-cyan' : ''}>[03] lifestyle</span>
                <span className={step === 4 ? 'text-neon-cyan' : ''}>[04] ANALYSIS</span>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                <form onSubmit={(e) => e.preventDefault()} className="flex-1">
                  <AnimatePresence mode="wait">
                  
                  {/* STEP 1: HOUSEHOLD ENERGY */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="text-neon-cyan" />
                        <h2 className="text-xl font-display text-white">Household Energy Telemetry</h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1 font-mono">
                            <span className="text-gray-400">Monthly Electricity Consumption</span>
                            <span className="text-neon-cyan">{electricity} kWh</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="1500"
                            step="25"
                            value={electricity}
                            onChange={(e) => setElectricity(parseInt(e.target.value))}
                            className="w-full accent-neon-cyan bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1 font-mono">
                            <span className="text-gray-400">Monthly Natural Gas usage</span>
                            <span className="text-neon-cyan">{gas} Therms</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="250"
                            step="5"
                            value={gas}
                            onChange={(e) => setGas(parseInt(e.target.value))}
                            className="w-full accent-neon-cyan bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: TRANSIT & FLIGHTS */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <Plane className="text-neon-purple" />
                        <h2 className="text-xl font-display text-white">Transportation Auditing</h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1 font-mono">
                            <span className="text-gray-400">Monthly Vehicle Commute</span>
                            <span className="text-neon-purple">{carMiles} Miles</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="3000"
                            step="50"
                            value={carMiles}
                            onChange={(e) => setCarMiles(parseInt(e.target.value))}
                            className="w-full accent-neon-purple bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {carMiles > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1 font-mono">
                              <span className="text-gray-400">Average Fuel Economy (MPG)</span>
                              <span className="text-neon-purple">{carMpg} MPG</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="60"
                              step="1"
                              value={carMpg}
                              onChange={(e) => setCarMpg(parseInt(e.target.value))}
                              className="w-full accent-neon-purple bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between text-sm mb-1 font-mono">
                            <span className="text-gray-400">Annual Flights Taken</span>
                            <span className="text-neon-purple">{flights} Flights</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={flights}
                            onChange={(e) => setFlights(parseInt(e.target.value))}
                            className="w-full accent-neon-purple bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: LIFESTYLE & DIET */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <Leaf className="text-emerald-400" />
                        <h2 className="text-xl font-display text-white">Dietary & Consumption Profile</h2>
                      </div>
                      
                      <div>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-3">Primary Diet Habits</span>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { value: 'high', title: 'Heavy Meat', desc: 'Frequent red meat / dairy' },
                            { value: 'average', title: 'Average Omnivore', desc: 'Balanced meat, fish, plants' },
                            { value: 'veggie', title: 'Vegetarian', desc: 'No meat, includes dairy' },
                            { value: 'vegan', title: 'Plant-Based / Vegan', desc: 'Zero animal product footprint' }
                          ].map((diet) => (
                            <button
                              key={diet.value}
                              type="button"
                              onClick={() => setDietFactor(diet.value)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                dietFactor === diet.value 
                                  ? 'bg-emerald-500/10 border-emerald-400 shadow-lg shadow-emerald-500/5 text-white' 
                                  : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-400'
                              }`}
                            >
                              <span className="font-semibold block text-sm">{diet.title}</span>
                              <span className="text-xs mt-1 block opacity-70 leading-normal">{diet.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: ANALYSIS RESULTS */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 text-center"
                    >
                      <div className="inline-flex w-12 h-12 bg-neon-blue/10 border border-neon-blue/20 rounded-xl items-center justify-center text-neon-blue">
                        <ShieldCheck size={24} />
                      </div>
                      
                      <div>
                        <span className="text-xs font-mono text-neon-blue uppercase tracking-widest block">AUDIT COMPLETED</span>
                        <h2 className="text-3xl font-display text-white mt-1">Your Annual Carbon Footprint</h2>
                      </div>

                      <div className="py-4 glass rounded-2xl max-w-xs mx-auto border border-white/5">
                        <span className="text-5xl font-mono text-neon-cyan font-semibold">{total}</span>
                        <span className="text-xs text-gray-400 block mt-1 font-mono uppercase tracking-wider">TONNES CO2 / YEAR</span>
                      </div>

                      <p className="text-xs text-gray-400 leading-normal max-w-sm mx-auto">
                        An average global footprint is ~4.8 tonnes. To meet global climate targets, the average target footprint must decrease below 2.0 tonnes per year.
                      </p>

                      <button
                        onClick={resetCalculator}
                        className="inline-flex items-center gap-2 text-xs font-mono text-neon-purple hover:text-white transition-colors border border-neon-purple/20 bg-neon-purple/5 px-4 py-2 rounded-xl"
                      >
                        <RefreshCw size={12} />
                        <span>RECALCULATE AUDIT</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Vertical Impact battery meter */}
              {step < 4 && (
                <div className="flex flex-col items-center justify-between p-4 glass rounded-2xl border border-white/5 w-24 shrink-0">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider text-center">Carbon Index</span>
                  
                  <div className="w-8 h-48 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden flex flex-col justify-end p-0.5 mt-2">
                    <div 
                      className={`w-full rounded-lg transition-all duration-500 relative ${
                        total < 5 
                          ? 'bg-gradient-to-t from-[#00d4ff] to-[#06ffd4] shadow-[0_0_15px_rgba(6,255,212,0.4)]'
                          : total < 10
                          ? 'bg-gradient-to-t from-[#ff8800] to-[#ffcc00] shadow-[0_0_15px_rgba(255,204,0,0.4)]'
                          : 'bg-gradient-to-t from-[#ff0090] to-[#ff4444] shadow-[0_0_15px_rgba(255,68,68,0.4)]'
                      }`}
                      style={{ height: `${Math.min(100, Math.max(8, (total / 20) * 100))}%` }}
                    >
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-center mt-2">
                    <div className="text-sm font-bold font-mono text-white">{total}t</div>
                    <span className="text-[8px] font-mono text-gray-600">CO2/yr</span>
                  </div>
                </div>
              )}
            </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleStepChange(step - 1)}
                    onMouseEnter={playHover}
                    className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span>BACKWARD</span>
                  </button>
                ) : <div />}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => handleStepChange(step + 1)}
                    onMouseEnter={playHover}
                    className="flex items-center gap-2 text-xs font-mono text-neon-cyan hover:text-white transition-colors ml-auto bg-neon-cyan/5 border border-neon-cyan/20 px-4 py-2 rounded-xl"
                  >
                    <span>FORWARD</span>
                    <ChevronRight size={16} />
                  </button>
                ) : <div />}
              </div>
            </motion.div>
          </div>

          {/* Recharts Analytics & Offsetting */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* Chart Breakdown */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative">
              <h3 className="text-lg text-white font-normal font-display mb-4">CO2 Expenditure Breakdown</h3>
              
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                      formatter={(val) => [`${val} Tonnes`, 'CO2']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Inter' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Offset Marketplace */}
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
              <div>
                <h3 className="text-lg text-white font-normal font-display">Neutralize Your Footprint</h3>
                <p className="text-gray-400 text-xs mt-1">Offset your {total} tonnes of carbon emissions directly by funding certified green projects.</p>
              </div>

              <div className="space-y-3">
                {OFFSET_PROJECTS.map((proj) => {
                  const tonCost = proj.cost
                  const projectTotal = Math.ceil(tonCost * total)
                  return (
                    <div 
                      key={proj.id}
                      className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-between gap-4 transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Leaf size={14} className="text-emerald-400" />
                          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{proj.location}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1 group-hover:text-neon-cyan transition-colors">{proj.name}</h4>
                        <p className="text-[11px] text-gray-400 leading-normal mt-1 max-w-[250px]">{proj.desc}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-mono font-semibold text-white block">${projectTotal}</span>
                        <button
                          onClick={() => setActiveProject({ ...proj, totalCost: projectTotal })}
                          className="mt-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold tracking-wider font-mono transition-colors"
                        >
                          OFFSET
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Glassmorphic Simulated Payment Modal */}
      <AnimatePresence>
        {activeProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!paying && !paymentSuccess) setActiveProject(null) }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="glass-strong border border-white/10 max-w-md w-full p-8 rounded-3xl relative z-10 shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-[40px]" />

              <AnimatePresence mode="wait">
                {!paymentSuccess ? (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                      <CreditCard size={20} />
                    </div>

                    <h3 className="text-xl text-white font-display">Fund Offset</h3>
                    <p className="text-gray-400 text-xs mt-1 mb-6 max-w-xs mx-auto">
                      Review payment to fund **{activeProject.name}** for **${activeProject.totalCost}**.
                    </p>

                    <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-left">
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardNum}
                          onChange={(e) => setCardNum(e.target.value.replace(/\D/g,'').slice(0, 16))}
                          placeholder="4000 1234 5678 9010"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-400 focus:outline-none text-white rounded-xl text-sm font-mono"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Alex Carter"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-400 focus:outline-none text-white rounded-xl text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="MM / YY"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-400 focus:outline-none text-white rounded-xl text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Security Code (CVC)</label>
                          <input
                            type="password"
                            required
                            maxLength="3"
                            placeholder="•••"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-emerald-400 focus:outline-none text-white rounded-xl text-sm font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={paying}
                        className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 disabled:opacity-75"
                      >
                        {paying ? 'Authorizing Offset...' : `Pay $${activeProject.totalCost}`}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 py-6"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                      <CheckCircle2 size={32} />
                    </div>

                    <h3 className="text-2xl text-white font-display">Offset Verified</h3>
                    
                    {/* Rotating 3D Carbon Certificate */}
                    <motion.div
                      initial={{ rotateY: 90, scale: 0.95 }}
                      animate={{ rotateY: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.4 }}
                      className="glass-strong border border-emerald-400/20 p-6 rounded-2xl max-w-sm mx-auto text-center relative overflow-hidden shadow-2xl"
                      style={{ perspective: 1000 }}
                    >
                      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none" />
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest border border-emerald-400/20 px-2 py-0.5 rounded-full inline-block mb-3">CARBON CREDIT CERTIFICATE</span>
                      
                      <h4 className="text-lg font-display text-white mt-1">{user?.name || "Climate Champion"}</h4>
                      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                        This certifies the permanent retirement and neutralization of
                      </p>
                      <div className="text-2xl font-mono font-bold text-emerald-400 my-2">
                        {total} Tonnes of CO₂e
                      </div>
                      <p className="text-[9px] text-gray-500 leading-normal">
                        Allocated towards the **{activeProject?.name}** on **{new Date().toLocaleDateString()}**.
                      </p>
                      <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3 text-[8px] font-mono text-gray-500">
                        <span>TXN: #{Math.floor(Math.random() * 9000000 + 1000000)}</span>
                        <span className="text-emerald-400">CERTIFIED SECURE</span>
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono uppercase font-semibold max-w-[240px] mx-auto">
                      <Sparkles size={14} />
                      <span>Unlocked Eco-Guardian</span>
                    </div>

                    <button
                      onClick={() => {
                        setPaymentSuccess(false)
                        setCardNum('')
                        setCardName('')
                        setActiveProject(null)
                      }}
                      onMouseEnter={playHover}
                      className="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono transition-colors"
                    >
                      RETURN TO HUB
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
