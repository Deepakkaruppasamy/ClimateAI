import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sun, Battery, Zap, DollarSign, Leaf, Award, 
  TrendingUp, HelpCircle, Thermometer, Globe, ArrowRight 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover } from '../utils/audio'

const CITIES = [
  { name: 'San Francisco', lat: 37.77, lon: -122.41, sunlight: 5.4, rate: 0.32 },
  { name: 'New York', lat: 40.71, lon: -74.01, sunlight: 4.5, rate: 0.26 },
  { name: 'London', lat: 51.51, lon: -0.12, sunlight: 3.1, rate: 0.38 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69, sunlight: 4.0, rate: 0.22 },
  { name: 'Dubai', lat: 25.20, lon: 55.27, sunlight: 6.8, rate: 0.12 },
  { name: 'Sydney', lat: -33.87, lon: 151.21, sunlight: 5.6, rate: 0.28 },
  { name: 'Singapore', lat: 1.35, lon: 103.82, sunlight: 5.2, rate: 0.24 },
]

export default function GreenInvest() {
  // Inputs
  const [solarKw, setSolarKw] = useState(8)
  const [batteryKwh, setBatteryKwh] = useState(10)
  const [geothermalTons, setGeothermalTons] = useState(0)
  const [sunlightHours, setSunlightHours] = useState(4.8)
  const [rateKwh, setRateKwh] = useState(0.24)
  const [selectedCity, setSelectedCity] = useState('')
  const [hasRebate, setHasRebate] = useState(true)

  // System parameters
  const [chartData, setChartData] = useState([])
  const [breakEvenYear, setBreakEvenYear] = useState(null)
  const [netInvestment, setNetInvestment] = useState(0)
  const [lifetimeSavings, setLifetimeSavings] = useState(0)
  const [lifetimeCo2, setLifetimeCo2] = useState(0)
  const [lifetimeTrees, setLifetimeTrees] = useState(0)

  // Set inputs when city is changed
  const handleCitySelect = (cityName) => {
    playTap()
    setSelectedCity(cityName)
    if (cityName === 'gps') {
      // Simulate GPS reading
      setSunlightHours(4.8)
      setRateKwh(0.25)
      return
    }
    const city = CITIES.find(c => c.name === cityName)
    if (city) {
      setSunlightHours(city.sunlight)
      setRateKwh(city.rate)
    }
  }

  // Live recalculations
  useEffect(() => {
    // Costs
    const solarCost = solarKw * 2200
    const batteryCost = batteryKwh * 600
    const geoCost = geothermalTons * 4200
    const grossCost = solarCost + batteryCost + geoCost
    const rebateAmount = hasRebate ? grossCost * 0.30 : 0 // 30% Federal ITC
    const netCost = grossCost - rebateAmount
    setNetInvestment(netCost)

    // Production & Savings
    // solarKw * sunlightHours * 365 days * 0.82 (efficiency factor)
    const annualProductionKwh = solarKw * sunlightHours * 365 * 0.82
    
    // Battery storage boosts self-consumption rate (meaning less energy sold back at low rates)
    // base self-consumption is 65%, each kWh battery boosts it by 3%, max 95%
    const selfConsumptionRate = Math.min(0.95, 0.65 + (batteryKwh * 0.03))
    const sellBackRate = 0.08 // Net metering export tariff
    
    const effectiveRate = (selfConsumptionRate * rateKwh) + ((1 - selfConsumptionRate) * sellBackRate)
    const annualSolarSavings = annualProductionKwh * effectiveRate
    
    // Geothermal offsets heating bills by approx $650 per ton per year
    const annualGeoSavings = geothermalTons * 650
    const totalAnnualSavings = annualSolarSavings + annualGeoSavings

    // 25-Year Projection Loop
    const inflation = 1.035 // Utility rates climb 3.5% annually
    const degradation = 0.995 // Panels degrade 0.5% annually
    
    let tempChartData = []
    let cumulativeSolarSavings = -netCost
    let cumulativeGridSpend = 0
    let tempBreakEvenYear = null

    // Year 0
    tempChartData.push({
      year: 'Year 0',
      yearNum: 0,
      'Investment Balance': Math.round(cumulativeSolarSavings),
      'Standard Utility Bill': 0,
      savings: 0
    })

    for (let year = 1; year <= 25; year++) {
      const yearFactor = Math.pow(inflation, year)
      const degFactor = Math.pow(degradation, year)
      
      const yearSavings = totalAnnualSavings * yearFactor * degFactor
      const yearStandardBill = (annualProductionKwh * rateKwh) * yearFactor

      cumulativeSolarSavings += yearSavings
      cumulativeGridSpend += yearStandardBill

      if (cumulativeSolarSavings >= 0 && tempBreakEvenYear === null) {
        tempBreakEvenYear = year
      }

      tempChartData.push({
        year: `Yr ${year}`,
        yearNum: year,
        'Investment Balance': Math.round(cumulativeSolarSavings),
        'Standard Utility Bill': Math.round(cumulativeGridSpend),
        savings: Math.round(cumulativeSolarSavings)
      })
    }

    setChartData(tempChartData)
    setBreakEvenYear(tempBreakEvenYear)
    setLifetimeSavings(cumulativeSolarSavings)

    // Ecological calculations (25 years total)
    // 1 kWh = 0.85 lbs CO2
    const totalLifetimeKwh = annualProductionKwh * 25 * 0.93 // averaging degradation
    const metricTonsCo2 = (totalLifetimeKwh * 0.85) / 2204.62
    setLifetimeCo2(metricTonsCo2)

    // 1 tree absorbs approx 48 lbs CO2 annually -> ~1200 lbs over 25 yrs
    const equivalentTrees = (totalLifetimeKwh * 0.85) / 1200
    setLifetimeTrees(equivalentTrees)

  }, [solarKw, batteryKwh, geothermalTons, sunlightHours, rateKwh, hasRebate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16 relative overflow-hidden bg-[#020409]"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4"
        overlay="dark"
        grain={true}
      />

      <div className="absolute inset-0 bg-animated-grid opacity-10 pointer-events-none z-[2]" />

      <div className="max-w-[95%] xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Header Telemetry */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6">
          <div>
            <span className="label-overline mb-1.5 inline-block text-neon-blue">[ TRANSITION_PORTFOLIO: ACTIVE ]</span>
            <h1 className="heading-display text-4xl text-white font-display font-light">
              Green <span className="gradient-text font-bold">Invest Calculator</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Optimize solar microgrids and calculate long-term ecological yield ROI.</p>
          </div>
          
          <div className="mt-4 md:mt-0 bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Preset Array:</span>
            <select
              value={selectedCity}
              onChange={(e) => handleCitySelect(e.target.value)}
              onMouseEnter={playHover}
              className="bg-black/60 border border-white/10 text-white font-mono text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-neon-blue"
            >
              <option value="">-- CUSTOM LOCALE --</option>
              {CITIES.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
              <option value="gps">📡 GPS Position Feed</option>
            </select>
          </div>
        </div>

        {/* ROI Key Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden bg-black/30 group"
          >
            <div className="absolute -right-6 -top-6 text-neon-blue/10 group-hover:text-neon-blue/20 transition-colors pointer-events-none">
              <DollarSign size={90} />
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block tracking-wider mb-2">Net Capital Investment</span>
            <div className="text-3xl font-display font-light text-white">
              ${Math.round(netInvestment).toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-2">
              {hasRebate ? 'Includes 30% Govt Tax Credit deduction' : 'Gross investment cost without rebates'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden bg-black/30 group"
          >
            <div className="absolute -right-6 -top-6 text-neon-cyan/10 group-hover:text-neon-cyan/20 transition-colors pointer-events-none">
              <TrendingUp size={90} />
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block tracking-wider mb-2">25-Year Cumulative ROI</span>
            <div className="text-3xl font-display font-light text-neon-cyan font-bold">
              ${Math.round(Math.max(0, lifetimeSavings)).toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-2">
              ROI Factor: +{(Math.max(0, lifetimeSavings) / Math.max(1, netInvestment)).toFixed(1)}x over net cost
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden bg-black/30 group"
          >
            <div className="absolute -right-6 -top-6 text-neon-purple/10 group-hover:text-neon-purple/20 transition-colors pointer-events-none">
              <Award size={90} />
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block tracking-wider mb-2">Payback Year (Break-Even)</span>
            <div className="text-3xl font-display font-light text-neon-purple font-bold">
              {breakEvenYear ? `${breakEvenYear} Years` : '15+ Years'}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-2">
              Year of fully amortized grid independence
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-6 border border-[#06ffd4]/20 relative overflow-hidden bg-black/30 group"
          >
            <div className="absolute -right-6 -top-6 text-[#06ffd4]/10 group-hover:text-[#06ffd4]/20 transition-colors pointer-events-none">
              <Leaf size={90} />
            </div>
            <span className="text-[10px] font-mono text-[#06ffd4] uppercase block tracking-wider mb-2">Carbon Offset (CO2 Metric Tons)</span>
            <div className="text-3xl font-display font-light text-[#06ffd4] font-bold">
              {lifetimeCo2.toFixed(1)}t
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-2">
              Equivalent to planting {Math.round(lifetimeTrees).toLocaleString()} trees
            </p>
          </motion.div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Console Panel (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
              
              <div className="border-b border-white/10 pb-3 flex items-center gap-2">
                <Sun size={18} className="text-neon-blue animate-pulse" />
                <h3 className="text-sm font-mono text-white uppercase tracking-wider">Microgrid Asset Settings</h3>
              </div>

              {/* Solar Array Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Solar PV Array Size</span>
                  <span className="text-neon-cyan font-bold">{solarKw} kW</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="1"
                  value={solarKw}
                  onChange={(e) => { playTap(); setSolarKw(parseInt(e.target.value)) }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                />
                <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                  <span>2 kW (Residential)</span>
                  <span>25 kW (Commercial)</span>
                </div>
              </div>

              {/* Battery Storage Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Battery Storage Capacity</span>
                  <span className="text-neon-blue font-bold">{batteryKwh} kWh</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={batteryKwh}
                  onChange={(e) => { playTap(); setBatteryKwh(parseInt(e.target.value)) }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                />
                <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                  <span>0 kWh (Grid Tied)</span>
                  <span>30 kWh (High Autonomy)</span>
                </div>
              </div>

              {/* Geothermal Heat Pump Load */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Geothermal Heat Pump</span>
                  <span className="text-neon-purple font-bold">
                    {geothermalTons === 0 ? 'None' : `${geothermalTons} Tons`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={geothermalTons}
                  onChange={(e) => { playTap(); setGeothermalTons(parseInt(e.target.value)) }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                />
                <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                  <span>No Geothermal</span>
                  <span>5 Tons (Full HVAC Offset)</span>
                </div>
              </div>

              <div className="border-b border-white/10 pb-3 pt-2 flex items-center gap-2">
                <Globe size={16} className="text-[#06ffd4]" />
                <h3 className="text-sm font-mono text-white uppercase tracking-wider">Meteorological Feeds</h3>
              </div>

              {/* Sun Exposure Hours */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Sun Hours / Day (Solar Irradiance)</span>
                  <span className="text-yellow-400 font-bold">{sunlightHours.toFixed(1)} hrs</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.1"
                  value={sunlightHours}
                  onChange={(e) => { playTap(); setSunlightHours(parseFloat(e.target.value)) }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
                <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                  <span>2.0 hrs (Overcast/High Lat)</span>
                  <span>8.0 hrs (Extreme Desert)</span>
                </div>
              </div>

              {/* Electricity Price Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Grid Utility Cost / kWh</span>
                  <span className="text-[#06ffd4] font-bold">${rateKwh.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.60"
                  step="0.01"
                  value={rateKwh}
                  onChange={(e) => { playTap(); setRateKwh(parseFloat(e.target.value)) }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#06ffd4]"
                />
                <div className="flex justify-between text-[9px] text-gray-600 font-mono">
                  <span>$0.10 (Low Grid Rate)</span>
                  <span>$0.60 (Peak Congestion Rate)</span>
                </div>
              </div>

              {/* Tax Credit Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-white font-bold">Federal Tax Credit (ITC)</span>
                  <span className="text-[9px] text-gray-500 font-mono">Apply 30% capital tax deduction</span>
                </div>
                <button
                  onClick={() => { playTap(); setHasRebate(!hasRebate) }}
                  onMouseEnter={playHover}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                    hasRebate ? 'bg-neon-cyan' : 'bg-white/10'
                  }`}
                >
                  <motion.div
                    layout
                    className="w-5 h-5 rounded-full bg-black shadow-lg"
                    animate={{ x: hasRebate ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Savings Projection Visualizer (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-sm font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-neon-cyan animate-pulse" /> 25-Year Cumulative Savings Projection
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Projects standard grid costs vs amortized microgrid savings
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-2 sm:mt-0 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-neon-cyan" />
                    <span className="text-gray-400">Transition ROI Balance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-white/20" />
                    <span className="text-gray-400">Utility Cost (Without Solar)</span>
                  </div>
                </div>
              </div>

              {/* Recharts AreaChart Container */}
              <div className="h-[360px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUtility" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="year" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={10} 
                      fontFamily="JetBrains Mono, monospace" 
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={10} 
                      fontFamily="JetBrains Mono, monospace"
                      tickFormatter={(v) => `$${Math.round(v/1000)}k`} 
                    />
                    
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(4, 13, 26, 0.95)',
                        border: '1px solid rgba(6, 255, 212, 0.2)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />

                    {/* Break-even indicator line */}
                    {breakEvenYear && (
                      <ReferenceLine 
                        x={`Yr ${breakEvenYear}`} 
                        stroke="#a78bfa" 
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'PAYBACK', 
                          position: 'top', 
                          fill: '#a78bfa', 
                          fontSize: 9, 
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 'bold'
                        }} 
                      />
                    )}
                    
                    {/* Standard Utility bills */}
                    <Area 
                      type="monotone" 
                      dataKey="Standard Utility Bill" 
                      stroke="rgba(255,255,255,0.2)" 
                      fillOpacity={1} 
                      fill="url(#colorUtility)" 
                      strokeWidth={1.5}
                    />

                    {/* Active Transition Savings */}
                    <Area 
                      type="monotone" 
                      dataKey="Investment Balance" 
                      stroke="#00d4ff" 
                      fillOpacity={1} 
                      fill="url(#colorSavings)" 
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Telemetry Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs font-mono">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-gray-500 block uppercase text-[9px]">Lifetime Solar Output</span>
                  <div className="text-white font-bold text-sm">
                    {Math.round(solarKw * sunlightHours * 365 * 0.82 * 25).toLocaleString()} kWh
                  </div>
                  <span className="text-gray-600 block text-[8px]">Projected over 25-year lifespan</span>
                </div>
                
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-gray-500 block uppercase text-[9px]">Effective Energy Rate</span>
                  <div className="text-neon-cyan font-bold text-sm">
                    ${(rateKwh * 0.85).toFixed(2)} / kWh
                  </div>
                  <span className="text-gray-600 block text-[8px]">Factoring battery capacity shift</span>
                </div>

                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-gray-500 block uppercase text-[9px]">Standard Grid Payoff</span>
                  <div className="text-red-400 font-bold text-sm">
                    ${Math.round((solarKw * sunlightHours * 365 * 0.82 * rateKwh) * 44).toLocaleString()}
                  </div>
                  <span className="text-gray-600 block text-[8px]">Utility outlay (No Solar)</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </motion.div>
  )
}
