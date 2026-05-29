import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Leaf, Landmark, Newspaper, Cpu, BellRing, Trophy, ArrowRight, Star, User } from 'lucide-react'
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#070a13]">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_133010_cb9c806d-bc9d-47f1-ac4c-b1759134ec8b.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between mb-12">
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
      </div>
    </div>
  )
}
