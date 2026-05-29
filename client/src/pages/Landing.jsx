import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TypeAnimation } from 'react-type-animation'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'
import { 
  ArrowRight, Zap, Wind, Droplets, Eye, Shield, 
  Brain, BarChart2, Map, Bell, Cloud, Sun, Thermometer,
  TrendingUp, Globe, Activity, Layers, ChevronRight, Play
} from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import WeatherParticles from '../components/hero/WeatherParticles'
import AnimatedGlobe from '../components/hero/AnimatedGlobe'
import { useWeather } from '../context/WeatherContext'
import use3dTilt from '../utils/use3dTilt'
import { playTap, playHover } from '../utils/audio'

// ── Video pool (cycling on hero) ────────────────────────────
const HERO_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4',
  'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_133010_cb9c806d-bc9d-47f1-ac4c-b1759134ec8b.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_102933_4e8f73b5-775a-4179-b2fb-472f59063dcd.mp4',
]

const getDiagReport = (year) => {
  if (year < 2040) return "BASELINE ESTABLISHED. TEMP VARIANCE AT +1.1°C. STABLE DATA STREAM FROM SAT CORE."
  if (year < 2060) return "WARN: UNDERGROUND EMISSION LOOPS EXCEED DRIFT VALUES. POLAR MELT INDEX AT 24%."
  if (year < 2080) return "CRITICAL ALARM: EXCEEDED +1.8°C LIMIT. CARBON SPURTS RECORDED IN TROPICS."
  return "EXTREME EMERGENCY: SYSTEM DEVIATION APPRECIABLE. CARBON PEAKS AT 560 PPM. ALBEDO REFLECTION FAILED."
}

// ── Floating Weather Card ────────────────────────────────────
function FloatingCard({ delay = 0, className = '', children }) {
  const tiltProps = use3dTilt(7, 600)
  return (
    <motion.div
      ref={tiltProps.ref}
      onMouseMove={tiltProps.onMouseMove}
      onMouseLeave={tiltProps.onMouseLeave}
      onMouseEnter={playHover}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-strong rounded-2xl p-4 ${className}`}
      style={{
        ...tiltProps.style,
        animation: `float ${5 + delay}s ease-in-out ${delay}s infinite`
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Animated Stats Counter ───────────────────────────────────
function StatCounter({ value, suffix, label, icon: Icon, color }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 })
  const tiltProps = use3dTilt(5, 750)

  const combinedRef = (node) => {
    ref(node)
    tiltProps.ref.current = node
  }

  return (
    <motion.div
      ref={combinedRef}
      onMouseMove={tiltProps.onMouseMove}
      onMouseLeave={tiltProps.onMouseLeave}
      onMouseEnter={playHover}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="glass rounded-2xl p-6 text-center card-hover group cursor-default"
      style={tiltProps.style}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
        {inView && <CountUp end={value} duration={2.5} suffix={suffix} />}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </motion.div>
  )
}

// ── Feature Card ─────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay, badge, to }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const tiltProps = use3dTilt(7, 850)

  const combinedRef = (node) => {
    ref(node)
    tiltProps.ref.current = node
  }

  return (
    <motion.div
      ref={combinedRef}
      onMouseMove={tiltProps.onMouseMove}
      onMouseLeave={tiltProps.onMouseLeave}
      onMouseEnter={playHover}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: delay * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-6 card-hover group cursor-default relative overflow-hidden"
      style={tiltProps.style}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `radial-gradient(ellipse at 20% 20%, ${color}10 0%, transparent 70%)` }} />
      {badge && (
        <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full font-mono font-bold"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
          {badge}
        </span>
      )}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
        style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      <div className="mt-4 flex items-center gap-2 text-sm opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1 duration-300"
        style={{ color }}>
        <span>Explore</span>
        <ChevronRight size={14} />
      </div>
    </motion.div>
  )
}

// ── Weather Ticker ───────────────────────────────────────────
function WeatherTicker() {
  const cities = [
    { name: 'New York', temp: 22, icon: '🌤️' }, { name: 'London', temp: 15, icon: '🌧️' },
    { name: 'Tokyo', temp: 28, icon: '⛅' }, { name: 'Dubai', temp: 38, icon: '☀️' },
    { name: 'Paris', temp: 18, icon: '🌦️' }, { name: 'Mumbai', temp: 32, icon: '🌩️' },
    { name: 'Sydney', temp: 20, icon: '🌤️' }, { name: 'Singapore', temp: 30, icon: '⛈️' },
    { name: 'Berlin', temp: 12, icon: '☁️' }, { name: 'Toronto', temp: 16, icon: '🌧️' },
  ]
  const items = [...cities, ...cities]
  return (
    <div className="glass-nav border-y border-white/5 py-3 overflow-hidden">
      <div className="ticker-inner">
        {items.map((c, i) => (
          <span key={i} className="flex items-center gap-2 mx-8 text-sm text-gray-400">
            <span>{c.icon}</span>
            <span className="text-white font-medium">{c.name}</span>
            <span className="neon-text-blue font-semibold font-mono">{c.temp}°C</span>
            <span className="text-gray-600 mx-2">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main Landing Page ─────────────────────────────────────────
export default function Landing() {
  const { weather, weatherType, loading } = useWeather()
  const [simYear, setSimYear] = useState(2026)
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroY       = useTransform(scrollY, [0, 700], [0, -120])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroScale   = useTransform(scrollY, [0, 500], [1, 0.97])

  const features = [
    { icon: Cloud,     title: 'AI Weather Dashboard',  desc: 'Real-time temperature, AQI, UV index, wind maps, and 7-day forecasts powered by neural climate models.', color: '#00d4ff', badge: 'LIVE',  delay: 0 },
    { icon: Brain,     title: 'AI Chat Assistant',      desc: 'Voice-enabled conversational AI. Ask about weather, get smart clothing, travel, and health recommendations.', color: '#7c3aed', badge: 'AI',    delay: 1 },
    { icon: BarChart2, title: 'Climate Analytics',      desc: 'Animated charts, real-time graphs, heatmaps, radar visualizations and predictive trend analysis.', color: '#06ffd4', badge: 'NEW',   delay: 2 },
    { icon: Zap,       title: 'Smart Recommendations',  desc: 'AI-generated clothing, travel, health alerts and farming advice based on live hyperlocal conditions.', color: '#ff9900', delay: 3 },
    { icon: Shield,    title: 'Disaster Alert System',  desc: 'Pulsing emergency overlays, critical warning cards, and instant multi-channel alert dispatch.', color: '#ff4444', badge: 'ALERT', delay: 4 },
    { icon: Map,       title: 'Interactive Maps',       desc: '3D weather layers, animated precipitation markers, wind simulation and real-time global radar.', color: '#a78bfa', delay: 5 },
  ]

  const stats = [
    { value: 195, suffix: '+', label: 'Countries Monitored', icon: Globe,     color: '#00d4ff' },
    { value: 99.9, suffix: '%', label: 'Uptime Guaranteed',  icon: Activity,  color: '#06ffd4' },
    { value: 50,  suffix: 'M+', label: 'Data Points Daily',  icon: Layers,    color: '#7c3aed' },
    { value: 94,  suffix: '%',  label: 'Forecast Accuracy',  icon: TrendingUp, color: '#ff0090' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <WeatherParticles />

      {/* ══════════════════════════════════════════════════════
          HERO — Fullscreen video carousel
      ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Video background (HLS stream) */}
        <VideoBackground
          src="https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8"
          overlay="default"
          kenBurns={true}
          grain={true}
        />

        {/* Animated neon grid on top of video */}
        <div className="absolute inset-0 bg-animated-grid opacity-20 z-[3] pointer-events-none" />

        {/* Radial neon bloom */}
        <motion.div
          className="absolute inset-0 flex items-center justify-end z-[3] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 2 }}
        >
          <div className="w-[700px] h-[700px] rounded-full mr-[-150px]"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
        </motion.div>

        {/* ── Hero Content ───────────────────────────────── */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-[10] flex flex-1"
        >
          <div className="max-w-[95%] mx-auto px-6 lg:px-12 pt-28 pb-20 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[82vh]">

              {/* LEFT — Cinematic Copy */}
              <div className="space-y-8">
                {/* Overline badge */}
                <div className="anim-reveal-up delay-200">
                  <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                    <span className="label-overline">Climate Intelligence · v2.0</span>
                    <span className="label-overline text-gray-600">·</span>
                    <span className="label-overline text-white">Live</span>
                  </div>
                </div>

                {/* Main display heading — Instrument Serif */}
                <div className="anim-reveal-up delay-300">
                  <h1
                    className="text-white leading-[1.05]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(3.2rem, 7vw, 6.5rem)',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    AI-Powered{' '}
                    <span style={{
                      fontStyle: 'italic',
                      background: 'linear-gradient(135deg, #00d4ff, #06ffd4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      Climate
                    </span>
                    <br />
                    Intelligence
                  </h1>
                </div>

                {/* Italic subtitle */}
                <div className="anim-reveal-up delay-400">
                  <p className="display-subtitle text-gray-300">
                    Real-time weather, predictions,
                  </p>
                  <p className="display-subtitle text-gray-500">
                    analytics, alerts & AI recommendations.
                  </p>
                </div>

                {/* Type animation */}
                <div className="anim-reveal-up delay-500">
                  <div className="text-gray-400 text-lg font-light min-h-[32px]">
                    <TypeAnimation
                      sequence={[
                        'AI-powered forecasts for every city on Earth.',
                        2500,
                        'Smart alerts before the storm hits.',
                        2500,
                        'Your personal climate intelligence layer.',
                        2500,
                        'Next-generation weather operating system.',
                        2500,
                      ]}
                      repeat={Infinity}
                      speed={65}
                    />
                  </div>
                </div>

                {/* CTAs */}
                <div className="anim-reveal-up delay-600 flex flex-wrap gap-4">
                  <Link to="/dashboard" className="btn-primary group" onClick={playTap} onMouseEnter={playHover}>
                    <Zap size={18} />
                    <span>Launch Dashboard</span>
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/assistant" className="btn-ghost group" onClick={playTap} onMouseEnter={playHover}>
                    <Brain size={18} />
                    <span>Try AI Assistant</span>
                  </Link>
                </div>

                {/* Live weather chips */}
                {weather && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex flex-wrap gap-3"
                  >
                    {[
                      { icon: Thermometer, label: `${weather.temp}°C`,         sub: 'Temperature' },
                      { icon: Wind,        label: `${weather.windSpeed} km/h`,  sub: 'Wind Speed'  },
                      { icon: Droplets,    label: `${weather.humidity}%`,       sub: 'Humidity'    },
                      { icon: Eye,         label: `UV ${weather.uvIndex || 3}`, sub: 'UV Index'    },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={sub}
                        className="flex items-center gap-2 glass px-3 py-2 rounded-xl hover:neon-border-blue transition-all duration-300 cursor-default">
                        <Icon size={14} className="text-neon-blue" />
                        <div>
                          <div className="text-sm font-semibold text-white font-mono">{label}</div>
                          <div className="text-xs text-gray-500">{sub}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* RIGHT — 3D Globe + Floating Cards */}
              <div className="relative hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, rotateY: 15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-[520px]"
                >
                  <AnimatedGlobe />
                </motion.div>

                {/* Floating card: Current Weather */}
                <FloatingCard delay={0.6} className="absolute top-10 -left-10 w-54">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-neon-blue/20 flex items-center justify-center">
                      <Sun size={16} className="text-neon-blue" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">{weather?.city || 'Detecting…'}</div>
                      <div className="text-sm font-semibold text-white">{weather?.description || '---'}</div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    <span className="gradient-text-blue-cyan">{weather?.temp ?? '--'}°</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Feels like {weather?.feelsLike ?? '--'}°C</div>
                </FloatingCard>

                {/* Floating card: AQI */}
                <FloatingCard delay={1.1} className="absolute bottom-24 -left-2 w-44">
                  <div className="text-xs text-gray-400 mb-1 label-overline">Air Quality</div>
                  <div className="text-2xl font-bold text-neon-cyan" style={{ fontFamily: 'var(--font-display)' }}>Good</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-blue"
                      initial={{ width: 0 }} animate={{ width: '33%' }} transition={{ delay: 1.5, duration: 1 }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">AQI 42 · PM2.5 8μg</div>
                </FloatingCard>

                {/* Floating card: AI Forecast */}
                <FloatingCard delay={1.6} className="absolute top-24 -right-2 w-48">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={13} className="text-neon-purple" />
                    <span className="label-overline">AI Forecast</span>
                  </div>
                  <div className="space-y-2">
                    {['Mon', 'Tue', 'Wed'].map((d, i) => (
                      <div key={d} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{d}</span>
                        <span>{['⛅', '🌧️', '☀️'][i]}</span>
                        <span className="text-white font-medium font-mono">{[22, 18, 26][i]}°</span>
                      </div>
                    ))}
                  </div>
                </FloatingCard>

                {/* Floating card: Alert */}
                <FloatingCard delay={2.1} className="absolute bottom-6 right-2 w-48">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="label-overline text-red-400">Alert Active</span>
                  </div>
                  <div className="text-sm text-white font-semibold">High UV Warning</div>
                  <div className="text-xs text-gray-400 mt-1">UV index reaches 8+ today</div>
                </FloatingCard>
              </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="label-overline opacity-50">Scroll</span>
              <div className="w-px h-12 bg-gradient-to-b from-neon-blue to-transparent" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WEATHER TICKER
      ══════════════════════════════════════════════════════ */}
      <WeatherTicker />

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 relative">
        <div className="max-w-[95%] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((s, i) => <StatCounter key={i} {...s} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES — with secondary video bg
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        {/* Subtle video bg for features section */}
        <VideoBackground
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4"
          overlay="dark"
          kenBurns={false}
          grain={false}
        />
        <div className="absolute inset-0 bg-circuit opacity-30 z-[3]" />

        <div className="max-w-[95%] mx-auto px-6 lg:px-12 relative z-[10]">
          {/* Section header */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8"
            >
              <Zap size={13} className="text-neon-cyan" />
              <span className="label-overline">Platform Capabilities</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white mb-5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Intelligence at{' '}
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Every Layer
              </em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
            >
              From real-time data ingestion to AI-powered predictions — a complete climate intelligence stack.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NEURAL CLIMATE FORECAST SIMULATOR PREVIEW — Extended Section
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        {/* Dynamic premium background video loop */}
        <VideoBackground
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          overlay="dark"
          kenBurns={true}
          grain={true}
        />
        
        {/* Futuristic sci-fi telemetry grid */}
        <div className="absolute inset-0 bg-animated-grid opacity-10 z-[3] pointer-events-none" />

        <div className="max-w-[95%] mx-auto px-6 lg:px-12 relative z-[10]">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 border border-neon-purple/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
            >
              <Activity size={13} className="text-neon-purple animate-pulse" />
              <span className="label-overline">Dynamic Forecasting</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white mb-5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Neural Simulation{' '}
              <em style={{
                fontStyle: 'italic',
                background: 'linear-gradient(135deg, #7c3aed, #ff0090)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Telemetry
              </em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
            >
              Scrub the timeline to predict climate indicators up to the year 2100 under neural RCP anomalies.
            </motion.p>
          </div>

          {/* Interactive Console Grid */}
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* LEFT PANEL — Timeline Selector */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 glass-strong rounded-3xl p-8 border border-white/10 space-y-8 relative overflow-hidden"
            >
              {/* Telemetry Corner Decals */}
              <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-white/20 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-white/20 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-white/20 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-white/25 pointer-events-none" />

              <div>
                <span className="text-[10px] font-mono text-neon-purple uppercase tracking-widest block mb-2">[ YEAR_TIMELINE_SELECT ]</span>
                <h3 className="text-3xl font-display text-white">Target Simulation Horizon</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Drag the cursor to establish coordinate anomalies. System will procedurally adjust global telemetry projections.
                </p>
              </div>

              {/* Year Display Indicator */}
              <div className="text-center py-6 glass rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-animated-grid" />
                <div className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1">PROJECTIONS FOR YEAR</div>
                <div className="text-6xl font-bold font-mono tracking-tighter text-white" style={{ textShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
                  {simYear}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold"
                  style={{
                    color: simYear < 2040 ? '#00d4ff' : simYear < 2070 ? '#ff8800' : '#ff0090',
                    background: simYear < 2040 ? 'rgba(0,212,255,0.1)' : simYear < 2070 ? 'rgba(255,136,0,0.1)' : 'rgba(255,0,144,0.1)',
                    border: simYear < 2040 ? '1px solid rgba(0,212,255,0.2)' : simYear < 2070 ? '1px solid rgba(255,136,0,0.2)' : '1px solid rgba(255,0,144,0.2)'
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: simYear < 2040 ? '#00d4ff' : simYear < 2070 ? '#ff8800' : '#ff0090' }} />
                  {simYear < 2040 ? 'BASELINE_STABLE' : simYear < 2070 ? 'MODERATE_DEV_WARN' : 'CRITICAL_DRIFT_ALERT'}
                </div>
              </div>

              {/* Tactile Range Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>START: 2026</span>
                  <span>HORIZON: 2100</span>
                </div>
                <input
                  type="range"
                  min="2026"
                  max="2100"
                  step="1"
                  value={simYear}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setSimYear(val)
                    if (val % 2 === 0) playTap()
                  }}
                  onMouseEnter={playHover}
                  className="w-full accent-neon-purple h-2 rounded-lg bg-white/10 cursor-pointer shadow-lg hover:shadow-neon-purple/10 transition-shadow"
                />
              </div>
            </motion.div>

            {/* RIGHT PANEL — Projections Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 glass-strong rounded-3xl p-8 border border-white/10 space-y-6 relative overflow-hidden"
            >
              {/* Telemetry Corner Decals */}
              <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-white/20 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-white/20 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-white/20 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-white/25 pointer-events-none" />

              <div>
                <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest block mb-2">[ NEURAL_TELEMETRY_DASHBOARD ]</span>
                <h3 className="text-2xl font-display text-white">Atmospheric Projection Models</h3>
              </div>

              {/* Stats Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'CO2 Density', val: `${Math.round(420 + ((simYear - 2026) / (2100 - 2026)) * 140)} ppm`, color: '#06ffd4', desc: 'Carbon accumulation' },
                  { label: 'Temp Variance', val: `+${(1.1 + ((simYear - 2026) / (2100 - 2026)) * 1.7).toFixed(2)}°C`, color: simYear < 2040 ? '#00d4ff' : simYear < 2070 ? '#ff8800' : '#ff0090', desc: 'Global anomaly' },
                  { label: 'Sea Level Rise', val: `+${Math.round(8 + ((simYear - 2026) / (2100 - 2026)) * 37)} cm`, color: '#a78bfa', desc: 'Water swelling' }
                ].map(({ label, val, color, desc }) => (
                  <div key={label} className="glass rounded-2xl p-4 border border-white/5 group hover:border-white/10 transition-colors">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">{label}</span>
                    <div className="text-xl font-bold font-mono mt-1 transition-all" style={{ color, textShadow: `0 2px 10px ${color}20` }}>
                      {val}
                    </div>
                    <span className="text-[8px] text-gray-600 font-mono mt-0.5 block">{desc}</span>
                  </div>
                ))}
              </div>

              {/* Diagnostic Terminal Printer */}
              <div className="glass rounded-2xl p-5 border border-white/5 font-mono space-y-3 relative overflow-hidden bg-black/40 min-h-[110px]">
                {/* Laser sweep overlay inside diagnostic console */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div className="absolute left-0 right-0 h-[1.5px] bg-neon-cyan laser-sweep" />
                </div>
                
                <div className="flex items-center justify-between text-[8px] text-gray-600 border-b border-white/5 pb-2">
                  <span>TELEMETRY FEED // REGISTER: D-209</span>
                  <span>SYS_LOG: SECURE</span>
                </div>
                
                <p className="text-xs text-neon-cyan leading-relaxed animate-pulse">
                  &gt; {getDiagReport(simYear)}
                </p>
              </div>

              {/* Circular SVG Vector Radar and Active Network Chime */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                    {/* Animated radar sweep line */}
                    <div className="absolute inset-0 border-r-2 border-neon-cyan animate-spin" style={{ animationDuration: '4s' }} />
                    <Activity size={16} className="text-neon-cyan animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/50 block">PREDICTIVE ANOMALY VECTOR</span>
                    <span className="text-[9px] font-mono text-gray-600 block">ACTIVE NEURAL CALIBRATION IN RUNTIME</span>
                  </div>
                </div>
                <Link to="/sandbox" className="btn-ghost py-2.5 px-6 rounded-xl text-xs font-mono flex items-center gap-2 group-hover:bg-white/5 transition-all">
                  <span>Go to Full Sandbox</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

            </motion.div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-white"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 400, letterSpacing: '-0.02em' }}
            >
              How{' '}
              <em style={{ fontStyle: 'italic', color: '#00d4ff' }}>ClimateAI</em>{' '}
              Works
            </motion.h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-10 relative">
            <div className="hidden lg:block absolute top-16 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan opacity-20" />
            {[
              { step: '01', title: 'Data Ingestion',  desc: '50,000+ global weather stations, satellites, and IoT sensors feed data every 60 seconds.', icon: Globe, color: '#00d4ff' },
              { step: '02', title: 'AI Processing',   desc: 'Deep neural networks and climate models process petabytes of data for precise predictions.', icon: Brain, color: '#7c3aed' },
              { step: '03', title: 'Smart Insights',  desc: 'Beautiful dashboards, natural language AI, and proactive alerts — all personalized to you.', icon: Zap, color: '#06ffd4' },
            ].map(({ step, title, desc, icon: Icon, color }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
                  <Icon size={30} style={{ color }} />
                </div>
                <div className="label-overline mb-2">Step {step}</div>
                <h3 className="text-white text-xl mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BANNER — with video bg
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Video in the CTA card */}
            <VideoBackground
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_031045_0e1165dd-ab48-46e3-ad3d-5fe77f217647.mp4"
              overlay="dark"
              kenBurns={true}
              grain={true}
            />
            <div className="relative z-10 p-14 text-center glass-strong">
              <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                <span className="label-overline">Ready to Launch</span>
              </span>
              <h2 className="text-white mb-5"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>
                Experience the Future of{' '}
                <em style={{ fontStyle: 'italic', color: '#00d4ff' }}>Climate Intelligence</em>
              </h2>
              <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join thousands of researchers, businesses, and individuals who trust ClimateAI for mission-critical decisions.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/dashboard" className="btn-primary" onClick={playTap} onMouseEnter={playHover}>
                  <Zap size={18} /> Open Dashboard <ArrowRight size={18} />
                </Link>
                <Link to="/assistant" className="btn-ghost" onClick={playTap} onMouseEnter={playHover}>
                  <Brain size={18} /> Meet AI Assistant
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-[95%] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>ClimateAI</span>
            </div>
            <div className="text-sm text-gray-600">© 2026 ClimateAI. All rights reserved.</div>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'API', 'Status'].map(l => (
                <a key={l} href="#" className="text-sm text-gray-500 hover:text-neon-blue transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  )
}
