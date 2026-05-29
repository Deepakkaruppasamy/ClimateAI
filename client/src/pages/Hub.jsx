import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Leaf, Landmark, Newspaper, Cpu, Trophy, ArrowRight, Star, User,
  Database, FileText, ShieldAlert, Layers, Globe, Activity, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VideoBackground from '../components/ui/VideoBackground'
import use3dTilt from '../utils/use3dTilt'
import { playTap, playHover } from '../utils/audio'

function ModuleCard({ mod }) {
  const tiltProps = use3dTilt(7, 950)
  const Icon = mod.icon

  return (
    <motion.div
      ref={tiltProps.ref}
      onMouseMove={tiltProps.onMouseMove}
      onMouseLeave={tiltProps.onMouseLeave}
      onMouseEnter={playHover}
      style={{ ...tiltProps.style, boxShadow: `0 20px 40px ${mod.shadowColor}` }}
      className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative group overflow-hidden flex flex-col justify-between min-h-[300px] cursor-default"
    >
      {/* Decorative colored glow ball */}
      <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${mod.color} opacity-10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`} />

      <div>
        {/* Icon wrap */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-6 shadow-lg`}>
          <Icon size={22} className="text-white" />
        </div>

        <h2 className="text-white text-xl font-normal mb-3 font-display">{mod.title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">{mod.description}</p>
      </div>

      <Link
        to={mod.path}
        onClick={playTap}
        onMouseEnter={playHover}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 group-hover:border-neon-blue/30 transition-all duration-300 text-xs font-mono"
      >
        <span>LAUNCH TELEMETRY</span>
        <ArrowRight size={14} className="text-gray-400 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  )
}

const modules = [
  {
    path: '/calculator',
    title: 'Carbon Calculator',
    description: 'Calculate your carbon emissions footprint across transit, energy, and diet, and offset it with verified credits.',
    icon: Leaf,
    color: 'from-emerald-400 to-green-500',
    shadowColor: 'rgba(52, 211, 153, 0.2)'
  },
  {
    path: '/sandbox',
    title: 'Climate Sandbox',
    description: 'Simulate climate projections under various IPCC scenarios up to 2100. Analyze average temperature, sea levels, and ice.',
    icon: Landmark,
    color: 'from-amber-400 to-orange-500',
    shadowColor: 'rgba(251, 191, 36, 0.2)'
  },
  {
    path: '/news',
    title: 'Policy & Tech News',
    description: 'Browse the latest international news on carbon capture, policy pacts, and engage with community comments.',
    icon: Newspaper,
    color: 'from-neon-blue to-neon-purple',
    shadowColor: 'rgba(0, 212, 255, 0.2)'
  },
  {
    path: '/iot',
    title: 'IoT Weather Station',
    description: 'Simulate connection to personal hardware sensors. Stream solar, moisture, and wind telemetry, and generate developer API keys.',
    icon: Cpu,
    color: 'from-indigo-400 to-purple-600',
    shadowColor: 'rgba(124, 58, 237, 0.2)'
  },
  {
    path: '/quiz',
    title: 'Climate Champion Quiz',
    description: 'Challenge your climate science knowledge, earn experience points (XP), collect badges, and climb the leaderboard.',
    icon: Trophy,
    color: 'from-yellow-300 to-yellow-500',
    shadowColor: 'rgba(234, 179, 8, 0.2)'
  }
]

export default function Hub() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pillars')
  
  // Green AI calculator state
  const [modelSize, setModelSize] = useState(8) // 8B, 70B, 405B parameters
  const [trainHours, setTrainHours] = useState(168) // hours

  // Estimate Carbon Math (Green AI Paradox)
  const calculateEmissions = () => {
    // Approx carbon intensity per training hour: 8B parameters = 0.42kg, 70B = 4.8kg, 405B = 27.5kg
    const baseFactor = modelSize === 8 ? 0.42 : modelSize === 70 ? 4.8 : 27.5
    const kgCo2 = baseFactor * trainHours
    const treesNeeded = (kgCo2 / 22).toFixed(1) // 1 tree absorbs approx 22kg of CO2 per year
    return { kgCo2: kgCo2.toFixed(1), treesNeeded }
  }

  const { kgCo2, treesNeeded } = calculateEmissions()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#070a13]">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_133010_cb9c806d-bc9d-47f1-ac4c-b1759134ec8b.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10 space-y-16">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
          <div>
            <span className="label-overline mb-2 inline-block">Climate Intelligence Center</span>
            <h1 className="text-white text-4xl lg:text-5xl font-light font-display">
              Climate <span className="gradient-text">Intelligence Hub</span>
            </h1>
            <p className="text-gray-400 text-base max-w-2xl mt-2">
              Launch modular intelligence suites to calculate carbon impacts, run time simulations, connect IoT hardware, configure notifications, and verify science telemetry.
            </p>
          </div>

          {/* User Achievement summary card */}
          {user && (
            <Link to="/profile">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,212,255,0.15)' }}
                className="glass p-5 rounded-2xl border border-white/10 flex items-center gap-6 max-w-sm w-full shadow-lg cursor-pointer transition-all"
              >
                <img className="w-14 h-14 rounded-xl object-cover border border-white/20" src={user.avatar} alt="avatar" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 font-mono">CHAMPION STATS</span>
                  <h3 className="text-white font-medium truncate text-base">{user.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-yellow-400 font-mono text-xs">
                      <Star size={12} fill="currentColor" />
                      <span>{user.quizStats?.xp || 0} XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-neon-cyan font-mono text-xs">
                      <Trophy size={12} />
                      <span>{user.badges?.length || 0} Badges</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-neon-blue text-[10px] font-mono">
                    <User size={9} />
                    <span>View Profile →</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          )}
        </div>

        {/* Modules Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {modules.map((mod) => (
            <ModuleCard key={mod.path} mod={mod} />
          ))}
        </motion.div>

        {/* ── Climate AI Knowledge Portal Section ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-strong rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden"
        >
          {/* Tech HUD Decals */}
          <div className="absolute top-3 left-4 text-[9px] font-mono text-neon-purple tracking-widest select-none">
            KNOWLEDGE_BASE // CORE_FOUNDATIONS
          </div>
          <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-white/10" />
          <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-white/10" />
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-white/10" />
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-white/10" />

          {/* Section Header */}
          <div className="mb-8 border-b border-white/5 pb-6">
            <h2 className="text-white text-3xl font-normal font-display">
              Climate AI <span className="gradient-text">Core Foundations</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              An interactive reference guide on standard machine learning architectures, high-integrity open datasets, core domain pillars, and green computing.
            </p>
          </div>

          {/* Dynamic Tab Selector */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {[
              { id: 'pillars', label: 'Core Pillars', icon: Layers },
              { id: 'datasets', label: 'Data Frameworks', icon: Database },
              { id: 'ml', label: 'ML Architectures', icon: Cpu },
              { id: 'green_ai', label: 'Green AI Paradox', icon: ShieldAlert }
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { playTap(); setActiveTab(tab.id) }}
                  onMouseEnter={playHover}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono transition-all ${
                    isActive 
                      ? 'bg-neon-purple/15 border-neon-purple text-neon-purple font-semibold shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                      : 'glass hover:bg-white/10 border-white/10 text-gray-400'
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label.toUpperCase()}</span>
                </button>
              )
            })}
          </div>

          {/* Tabs Content Registry */}
          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              {activeTab === 'pillars' && (
                <motion.div
                  key="pillars"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {[
                    { title: 'Mitigation', cases: 'Carbon emissions tracking, optimizing renewable energy grids, smart building efficiency.', data: 'IoT sensors, smart meter logs, industrial SCADA systems.', color: '#06ffd4', bg: 'rgba(6,255,212,0.02)' },
                    { title: 'Adaptation & Resilience', cases: 'Hyper-local weather forecasting, flood or wildfire early-warning systems, climate risk scoring for infrastructure.', data: 'Satellite imagery (Sentinel, Landsat), IoT weather stations, historical climate reanalysis.', color: '#00d4ff', bg: 'rgba(0,212,255,0.02)' },
                    { title: 'Agriculture & Nature', cases: 'Crop yield prediction, precision farming, deforestation monitoring, biodiversity tracking.', data: 'Drone/satellite data, soil moisture sensors, camera traps.', color: '#22c55e', bg: 'rgba(34,197,94,0.02)' },
                    { title: 'Climate Finance', cases: 'Carbon accounting, ESG (Environmental, Social, Governance) compliance parsing.', data: 'Corporate filings, financial transaction data, carbon market registries.', color: '#ff0090', bg: 'rgba(255,0,144,0.02)' }
                  ].map(p => (
                    <div key={p.title} className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between" style={{ background: p.bg }}>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p.color }} />
                          <h3 className="text-white text-base font-semibold font-display tracking-wide">{p.title}</h3>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed"><strong className="text-gray-400 font-mono text-[10px] block mb-1">TYPICAL USE CASES:</strong> {p.cases}</p>
                      </div>
                      <div className="mt-4 border-t border-white/5 pt-3 text-gray-400 text-xs leading-relaxed">
                        <strong className="text-gray-500 font-mono text-[10px] block mb-1">KEY DATA SOURCES:</strong> {p.data}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'datasets' && (
                <motion.div
                  key="datasets"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                      { title: 'Weather & Climate Physics', items: ['ERA5 (from ECMWF) for global climate reanalysis data', 'NEX-GDDP for downscaled climate projections'], icon: Globe, color: '#00d4ff' },
                      { title: 'Satellite Imagery', items: ['Google Earth Engine (GEE) APIs to process terabytes of spatial data', 'Microsoft Planetary Computer cloud databases'], icon: Database, color: '#06ffd4' },
                      { title: 'Ecosystem Tracking', items: ['Climate TRACE for emissions registries data', 'Wildbook computer vision-based wildlife tracking'], icon: Leaf, color: '#22c55e' }
                    ].map((d, i) => {
                      const Icon = d.icon
                      return (
                        <div key={i} className="glass p-5 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: `${d.color}15`, border: `1px solid ${d.color}25` }}>
                            <Icon size={16} style={{ color: d.color }} />
                          </div>
                          <h4 className="text-white font-medium text-sm mb-3 font-display">{d.title}</h4>
                          <ul className="space-y-2.5">
                            {d.items.map((item, idx) => (
                              <li key={idx} className="text-gray-400 text-xs leading-normal flex items-start gap-1.5">
                                <span className="text-neon-cyan select-none mt-0.5">·</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                  <div className="glass p-4 rounded-xl border border-white/5 text-gray-400 text-xs text-center font-mono select-none">
                    🔑 RECOMMENDED FLOW: ACCESS PIPELINES DIRECTLY VIA PLANETARY COMPUTER OR EARTH ENGINE API TO PREVENT DATA INGESTION BLOAT.
                  </div>
                </motion.div>
              )}

              {activeTab === 'ml' && (
                <motion.div
                  key="ml"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      { arch: 'Spatial Transformers', type: 'Satellite / Maps', use: 'Move beyond standard CNNs; use Vision Transformers (ViTs) or Graph Neural Networks (GNNs) to capture complex, non-local spatial mappings.', code: 'import torch_geometric' },
                      { arch: 'Physics-Informed NN', type: 'Fluid / Atmosphere', use: 'Physics-Informed Neural Networks (PINNs) embed laws of physics (like conservation of energy) into loss equations, preventing mathematically impossible output.', code: 'loss = mse_data + lambda * boundary_residuals' },
                      { arch: 'Generative Forecasters', type: 'Regional downscaling', use: 'Take inspiration from Nvidia’s Earth-2 or ClimateAi: utilize deep generative models to simulate extreme events and downscale predictions to 1km resolution.', code: 'model = NeuralDiffusionDownscaler()' }
                    ].map((m, idx) => (
                      <div key={idx} className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[220px]">
                        <div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mb-2">
                            <span>{m.type.toUpperCase()}</span>
                            <span className="text-neon-purple font-bold">// TECH</span>
                          </div>
                          <h4 className="text-white font-medium text-base mb-2 font-display">{m.arch}</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">{m.use}</p>
                        </div>
                        <div className="mt-4 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-neon-cyan truncate select-all">
                          <code>{m.code}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'green_ai' && (
                <motion.div
                  key="green_ai"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  {/* Left explanation */}
                  <div className="lg:col-span-7 space-y-5">
                    <div>
                      <h3 className="text-white text-lg font-normal font-display">The "Green AI" Paradox</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mt-2">
                        Training massive AI models consumes an enormous amount of electricity. If your climate project inadvertently emits tons of carbon during training, it defeats the purpose of saving the planet.
                      </p>
                    </div>
                    <ul className="space-y-3">
                      {[
                        { label: 'Track Your Footprint', text: 'Use lightweight trackers like CodeCarbon or Experiment Impact Tracker to log precise CO2 emissions during training loops.' },
                        { label: 'Optimize Training Efficiency', text: 'Fine-tune pre-trained foundational models rather than training heavy architectures from scratch. Always run data centers on 100% renewable energy.' }
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs">
                          <Zap size={14} className="text-neon-cyan shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white font-medium block">{item.label}</strong>
                            <span className="text-gray-400 leading-normal">{item.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right interactive Carbon Estimator */}
                  <div className="lg:col-span-5 glass p-6 rounded-2xl border border-white/5 space-y-5 relative overflow-hidden">
                    <div className="absolute top-2.5 right-3 text-[7px] font-mono text-neon-cyan/50 tracking-widest select-none">EMISSION_CALCULATOR</div>
                    
                    <h4 className="text-white text-xs font-mono tracking-wide uppercase">[ Training Footprint Estimator ]</h4>
                    
                    {/* Select Model size */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">Model Parameters</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 8, label: '8B (Llama)' },
                          { val: 70, label: '70B' },
                          { val: 405, label: '405B (Huge)' }
                        ].map(m => (
                          <button
                            key={m.val}
                            onClick={() => { playTap(); setModelSize(m.val) }}
                            className={`py-1.5 rounded-lg border text-[10px] font-mono transition-colors ${
                              modelSize === m.val 
                                ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan font-bold' 
                                : 'glass border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrub Hours */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-gray-500">
                        <span>TRAINING DURATION</span>
                        <span className="text-neon-purple font-bold">{trainHours} HOURS</span>
                      </div>
                      <input 
                        type="range" min="10" max="1000" step="10" value={trainHours} 
                        onChange={e => {
                          const val = parseInt(e.target.value)
                          setTrainHours(val)
                          if (val % 50 === 0) playTap()
                        }}
                        className="w-full accent-neon-purple bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Telemetry Output */}
                    <div className="border-t border-white/5 pt-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[8px] font-mono text-gray-500 uppercase block">ESTIMATED CO2 IMPACT</span>
                        <div className="text-2xl font-bold font-mono text-neon-cyan">{kgCo2} kg</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono text-gray-500 uppercase block">CARBON OFFSET EQUIVALENT</span>
                        <div className="text-xs font-mono text-white">{treesNeeded} Trees <span className="text-[10px] text-gray-600 block">(needed for 1 year)</span></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
