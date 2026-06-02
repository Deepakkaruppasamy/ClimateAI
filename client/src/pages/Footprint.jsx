import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Car, Zap, UtensilsCrossed, Plane, Trophy, TrendingDown, Award, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import VideoBackground from '../components/ui/VideoBackground'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES = [
  {
    id: 'transport',
    icon: Car,
    label: 'Transport',
    color: '#00d4ff',
    fields: [
      { key: 'carKm', label: 'Car distance today (km)', max: 500, unit: 'km', factor: 0.21 },
      { key: 'publicKm', label: 'Public transit (km)', max: 200, unit: 'km', factor: 0.08 },
      { key: 'flights', label: 'Short flights this month', max: 10, unit: 'flights', factor: 90 },
    ]
  },
  {
    id: 'energy',
    icon: Zap,
    label: 'Energy',
    color: '#ffcc00',
    fields: [
      { key: 'electricity', label: 'Electricity used (kWh)', max: 50, unit: 'kWh', factor: 0.4 },
      { key: 'gas', label: 'Natural gas (m³)', max: 30, unit: 'm³', factor: 2.0 },
    ]
  },
  {
    id: 'diet',
    icon: UtensilsCrossed,
    label: 'Diet',
    color: '#06ffd4',
    fields: [
      { key: 'beef', label: 'Beef/Lamb servings today', max: 5, unit: 'servings', factor: 6.0 },
      { key: 'dairy', label: 'Dairy servings today', max: 10, unit: 'servings', factor: 1.0 },
      { key: 'plantBased', label: 'Plant-based meals today', max: 5, unit: 'meals', factor: -0.5 },
    ]
  },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Priya S.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', score: 12, badge: '🌱', change: 'up' },
  { rank: 2, name: 'Arjun M.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun', score: 18, badge: '🌿', change: 'up' },
  { rank: 3, name: 'Chen W.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chen', score: 23, badge: '♻️', change: 'same' },
  { rank: 4, name: 'Sofia L.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia', score: 27, badge: '🌎', change: 'up' },
  { rank: 5, name: 'James O.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', score: 35, badge: '💚', change: 'down' },
  { rank: 6, name: 'Aisha B.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha', score: 41, badge: '🌍', change: 'up' },
]

function getRating(val) {
  if (val < 5) return { label: 'Excellent', color: '#06ffd4', emoji: '🌱' }
  if (val < 15) return { label: 'Good', color: '#22c55e', emoji: '🌿' }
  if (val < 30) return { label: 'Average', color: '#ffcc00', emoji: '🟡' }
  return { label: 'High', color: '#ff4444', emoji: '⚠️' }
}

export default function Footprint() {
  const { user } = useAuth()
  const [step, setStep] = useState(0) // 0=transport, 1=energy, 2=diet, 3=result
  const [values, setValues] = useState({
    carKm: 15, publicKm: 5, flights: 0,
    electricity: 8, gas: 2,
    beef: 1, dairy: 2, plantBased: 1
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  // Generate simulated history on mount
  useEffect(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        footprint: parseFloat((8 + Math.sin(i / 5) * 4 + Math.random() * 3).toFixed(1))
      })
    }
    setHistory(days)
  }, [])

  const calcFootprint = () => {
    let total = 0
    CATEGORIES.forEach(cat => {
      cat.fields.forEach(f => {
        total += (values[f.key] || 0) * f.factor
      })
    })
    return Math.max(0, parseFloat(total.toFixed(2)))
  }

  const footprintToday = calcFootprint()
  const rating = getRating(footprintToday)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await fetch('/api/carbon/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?._id || 'mock', footprint: footprintToday, values })
      }).catch(() => {})

      const today = new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' })
      setHistory(prev => [...prev.slice(-29), { date: today, footprint: footprintToday }])
      setSubmitted(true)
      toast.success(`Today's footprint logged: ${footprintToday} kg CO₂`)
    } finally {
      setLoading(false)
    }
  }

  const category = CATEGORIES[step]
  const userRank = Math.floor(Math.random() * 40) + 7

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12 relative overflow-hidden"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-10 pointer-events-none z-[3]" />

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,255,212,0.12)', border: '1px solid rgba(6,255,212,0.3)' }}>
              <Leaf size={20} style={{ color: '#06ffd4' }} />
            </div>
            <div>
              <h1 className="heading-display text-3xl text-white">Carbon <span className="gradient-text">Footprint</span></h1>
              <p className="text-gray-400 text-sm">Track, compete, and reduce your climate impact</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            <div className="flex items-center gap-2">
              {CATEGORIES.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setStep(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all border ${
                      step === i
                        ? 'text-white border-opacity-50'
                        : 'glass text-gray-500 border-white/5 hover:text-white'
                    }`}
                    style={step === i ? { background: `${cat.color}18`, borderColor: `${cat.color}50`, color: cat.color } : {}}
                  >
                    <Icon size={13} />
                    {cat.label}
                  </button>
                )
              })}
              <button
                onClick={() => setStep(3)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all border ${
                  step === 3 ? 'bg-neon-purple/15 border-neon-purple/50 text-neon-purple' : 'glass text-gray-500 border-white/5 hover:text-white'
                }`}
              >
                <CheckCircle size={13} />
                Result
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step < 3 && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="glass-strong rounded-3xl p-6 border border-white/5"
                >
                  <div className="flex items-center gap-3 mb-6">
                    {(() => { const Icon = category.icon; return <Icon size={20} style={{ color: category.color }} /> })()}
                    <div>
                      <h2 className="text-white font-semibold text-lg">{category.label}</h2>
                      <p className="text-gray-500 text-xs">Adjust your daily usage below</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {category.fields.map(field => (
                      <div key={field.key}>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm text-gray-300">{field.label}</label>
                          <span className="text-sm font-mono font-bold" style={{ color: category.color }}>
                            {values[field.key]} {field.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={field.max}
                          step={1}
                          value={values[field.key]}
                          onChange={e => setValues(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: category.color }}
                        />
                        <div className="flex justify-between text-[10px] font-mono text-gray-600 mt-1">
                          <span>0</span><span>{field.max} {field.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <button
                      onClick={() => setStep(Math.max(0, step - 1))}
                      disabled={step === 0}
                      className="px-4 py-2 rounded-xl glass text-gray-400 hover:text-white text-sm disabled:opacity-30 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(step + 1)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: `${category.color}18`, border: `1px solid ${category.color}50`, color: category.color }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-strong rounded-3xl p-8 border border-white/5 text-center"
                >
                  <div className="text-6xl mb-4">{rating.emoji}</div>
                  <div className="text-6xl font-bold font-outfit mb-1" style={{ color: rating.color }}>
                    {footprintToday}
                  </div>
                  <div className="text-gray-400 text-sm mb-2">kg CO₂ today</div>
                  <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6" style={{ background: `${rating.color}18`, color: rating.color }}>
                    {rating.label} Impact
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {CATEGORIES.map(cat => {
                      const catTotal = cat.fields.reduce((sum, f) => sum + Math.max(0, (values[f.key] || 0) * f.factor), 0)
                      const Icon = cat.icon
                      return (
                        <div key={cat.id} className="rounded-2xl p-4" style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}25` }}>
                          <Icon size={16} style={{ color: cat.color }} className="mx-auto mb-2" />
                          <div className="text-white font-bold text-lg font-mono">{catTotal.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">{cat.label}</div>
                        </div>
                      )
                    })}
                  </div>

                  {!submitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, rgba(6,255,212,0.2), rgba(0,212,255,0.2))', border: '1px solid rgba(6,255,212,0.3)' }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Leaf size={16} />}
                      {loading ? 'Logging...' : 'Log Today\'s Footprint'}
                    </button>
                  ) : (
                    <div className="px-6 py-3 rounded-xl text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 font-mono text-sm">
                      ✅ Footprint logged! Keep it up!
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="text-neon-cyan" />
                <h3 className="text-white font-semibold">30-Day Footprint Trend</h3>
              </div>
              <p className="text-gray-500 text-xs mb-4">Your daily kg CO₂ emissions over the last month</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="fpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06ffd4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06ffd4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 9 }} interval={6} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} unit=" kg" />
                  <Tooltip
                    contentStyle={{ background: '#040d1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                    formatter={v => [`${v} kg CO₂`, 'Footprint']}
                  />
                  <Area type="monotone" dataKey="footprint" stroke="#06ffd4" strokeWidth={2} fill="url(#fpGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-strong rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-yellow-400" />
                <div>
                  <h3 className="text-white font-semibold">Global Leaderboard</h3>
                  <p className="text-gray-500 text-xs">Lowest daily carbon footprint wins</p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-neon-blue font-mono font-bold text-lg">#{userRank}</span>
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} className="w-7 h-7 rounded-full" alt="you" />
                  <span className="text-white text-sm flex-1 truncate">{user?.name?.split(' ')[0] || 'You'}</span>
                  <span className="text-neon-blue text-sm font-mono font-bold">{footprintToday} kg</span>
                </div>
              </div>

              <div className="space-y-2">
                {MOCK_LEADERBOARD.map((entry, i) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      i === 0 ? 'bg-yellow-400/10 border border-yellow-400/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className={`font-mono font-bold text-sm w-6 text-center ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <img src={entry.avatar} className="w-7 h-7 rounded-full" alt={entry.name} />
                    <span className="text-white text-sm flex-1 truncate">{entry.name}</span>
                    <span className="text-xs">{entry.badge}</span>
                    <span className="text-neon-cyan text-xs font-mono font-bold">{entry.score} kg</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Award size={15} className="text-neon-purple" />
                <span className="text-white text-sm font-semibold">Quick Tips to Reduce</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                {[
                  '🚶 Walk or cycle for trips under 3km',
                  '🌱 Replace one beef meal with plant-based',
                  '💡 Switch off devices when not in use',
                  '🚆 Use public transit for long commutes',
                  '🌞 Opt for renewable energy at home',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
