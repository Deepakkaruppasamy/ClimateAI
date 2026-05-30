import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cloud, BarChart2, MessageSquare, Map, Bell, Settings, 
  Menu, X, Zap, Globe, Wind, Thermometer, LogIn, LogOut, User, BellDot,
  TrendingUp, ShieldAlert
} from 'lucide-react'
import { useWeather } from '../../context/WeatherContext'
import { useAuth } from '../../context/AuthContext'
import { isSoundEnabled, setSoundEnabled, playTap, playHover } from '../../utils/audio'

const navLinks = [
  { path: '/',               label: 'Home',          icon: Globe },
  { path: '/dashboard',      label: 'Dashboard',     icon: Cloud },
  { path: '/hub',            label: 'Climate Hub',   icon: Zap },
  { path: '/map',            label: 'Maps',          icon: Map },
  { path: '/invest',         label: 'Green Invest',  icon: TrendingUp },
  { path: '/emergency',      label: 'Disaster Room', icon: ShieldAlert },
  { path: '/assistant',      label: 'AI Chat',       icon: MessageSquare },
  { path: '/analytics',      label: 'Analytics',     icon: BarChart2 },
  { path: '/alerts',         label: 'Alerts',        icon: Bell },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location  = useLocation()
  const { weather } = useWeather()
  const { user, logout } = useAuth()
  const [audioOn, setAudioOn] = useState(isSoundEnabled())

  const toggleAudio = () => {
    const next = !audioOn
    setSoundEnabled(next)
    setAudioOn(next)
    if (next) playTap()
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-nav py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-6 xl:gap-8">
              {/* ── Logo ─────────────────────────────────────── */}
              <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 flex items-center justify-center overflow-hidden"
                    animate={{ boxShadow: [
                      '0 0 10px rgba(0,212,255,0.2)',
                      '0 0 20px rgba(0,212,255,0.4)',
                      '0 0 10px rgba(0,212,255,0.2)',
                    ]}}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <img src="/logo.png" alt="logo" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
                  </motion.div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-cyan rounded-full animate-pulse" />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-white font-semibold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                    Climate
                  </span>
                  <span className="text-xl font-semibold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
                    AI
                  </span>
                </div>
              </Link>

              {/* ── Desktop Navigation ───────────────────────── */}
              <div className="hidden lg:flex items-center gap-0.5">
                {navLinks.map(({ path, label, icon: Icon }) => {
                  const active = location.pathname === path
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={playTap}
                      onMouseEnter={playHover}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        active ? 'text-neon-blue' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: 'rgba(0,212,255,0.08)',
                            border: '1px solid rgba(0,212,255,0.2)',
                            boxShadow: '0 0 20px rgba(0,212,255,0.1)',
                          }}
                          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                        />
                      )}
                      <Icon size={14} className="relative z-10" />
                      <span className="relative z-10">{label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* ── Right Side ───────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {/* Sound Equalizer Switch */}
              <button
                onClick={toggleAudio}
                onMouseEnter={playHover}
                className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-xl border border-white/5 hover:border-neon-cyan/30 transition-all hover:bg-neon-cyan/5 text-gray-400 hover:text-white h-9"
                title={audioOn ? "Mute audio" : "Enable audio feedback"}
              >
                <div className="flex items-end gap-0.5 h-3 w-4 relative overflow-hidden">
                  {audioOn ? (
                    <>
                      <span className="w-0.5 bg-neon-cyan rounded-full eq-bar-1 origin-bottom inline-block h-full" />
                      <span className="w-0.5 bg-neon-cyan rounded-full eq-bar-2 origin-bottom inline-block h-3/4" />
                      <span className="w-0.5 bg-neon-cyan rounded-full eq-bar-3 origin-bottom inline-block h-4/5" />
                      <span className="w-0.5 bg-neon-cyan rounded-full eq-bar-4 origin-bottom inline-block h-1/2" />
                    </>
                  ) : (
                    <>
                      <span className="w-0.5 bg-gray-600 rounded-full h-[2px] inline-block" />
                      <span className="w-0.5 bg-gray-600 rounded-full h-[2px] inline-block" />
                      <span className="w-0.5 bg-gray-600 rounded-full h-[2px] inline-block" />
                      <span className="w-0.5 bg-gray-600 rounded-full h-[2px] inline-block" />
                    </>
                  )}
                </div>
                <span className="text-[10px] font-mono tracking-wider">{audioOn ? "SFX" : "MUTE"}</span>
              </button>

              {weather && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-2 glass px-4 py-2 rounded-xl"
                >
                  <Thermometer size={13} className="text-neon-blue" />
                  <span className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                    {weather.city}
                  </span>
                  <span className="text-sm text-neon-blue font-semibold font-mono">{weather.temp}°C</span>
                </motion.div>
              )}

              {/* User Profile / Auth State */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 glass pl-2 pr-3 py-1.5 rounded-xl hover:neon-border-blue transition-all duration-300">
                    <img className="w-7 h-7 rounded-lg object-cover" src={user.avatar} alt="avatar" />
                    <span className="text-sm text-white font-medium">{user.name.split(' ')[0]}</span>
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-52 glass-strong rounded-2xl p-2 hidden group-hover:block z-50 border border-white/5 shadow-2xl">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/5 truncate">
                      {user.email}
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left mt-1"
                    >
                      <User size={14} />
                      <span>My Profile</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neon-blue hover:bg-white/5 rounded-xl transition-all text-left border border-neon-blue/20 bg-neon-blue/5 hover:border-neon-blue/50"
                      >
                        <Settings size={14} />
                        <span className="font-medium">Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-xl transition-all text-left mt-1"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 btn-ghost px-4 py-2 rounded-xl text-sm">
                  <LogIn size={14} />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Live indicator */}
              <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">Live</span>
              </div>
            </div>

            {/* ── Mobile Toggle ────────────────────────────── */}
            <button
              className="lg:hidden glass p-2.5 rounded-xl"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle navigation"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen
                  ? <motion.div key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><X size={18} /></motion.div>
                  : <motion.div key="ham" initial={{ rotate: 90,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Menu size={18} /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Menu ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[68px] left-4 right-4 z-50 glass-strong rounded-2xl p-3 lg:hidden"
            >
              {navLinks.map(({ path, label, icon: Icon }, i) => (
                <motion.div
                  key={path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={path}
                    onClick={() => { playTap(); setMobileOpen(false); }}
                    onMouseEnter={playHover}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                      location.pathname === path
                        ? 'text-neon-blue neon-border-blue'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ background: location.pathname === path ? 'rgba(0,212,255,0.08)' : undefined }}
                  >
                    <Icon size={17} />
                    <span className="font-medium text-sm">{label}</span>
                    {location.pathname === path && (
                      <span className="ml-auto label-overline">Active</span>
                    )}
                  </Link>
                </motion.div>
              ))}
              {weather && (
                <div className="mt-2 pt-3 border-t border-white/5 px-4 flex items-center gap-2">
                  <Thermometer size={13} className="text-neon-blue" />
                  <span className="text-sm text-gray-400">{weather.city}</span>
                  <span className="text-sm font-mono text-neon-blue">{weather.temp}°C</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
