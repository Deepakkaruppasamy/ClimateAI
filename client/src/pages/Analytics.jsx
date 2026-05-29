import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart2, Activity, Calendar, Zap } from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Scatter
} from 'recharts'
import { useWeather } from '../context/WeatherContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-strong rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const { weather, forecast } = useWeather()
  const [period, setPeriod] = useState('week')

  // Generate simulated historical data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyData = months.map((m, i) => ({
    month: m,
    avgTemp: 10 + Math.sin((i / 12) * Math.PI * 2) * 12 + (Math.random() - 0.5) * 3,
    maxTemp: 18 + Math.sin((i / 12) * Math.PI * 2) * 14 + (Math.random() - 0.5) * 2,
    minTemp: 2 + Math.sin((i / 12) * Math.PI * 2) * 10 + (Math.random() - 0.5) * 2,
    precip: 50 + Math.random() * 80,
    humidity: 55 + Math.random() * 30,
  }))

  const weeklyData = forecast.slice(0, 7).map(d => ({
    day: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    max: d.maxTemp,
    min: d.minTemp,
    wind: d.windMax,
    precip: d.precip,
    uv: d.uvMax,
  }))

  const radarData = [
    { subject: 'Temperature', A: 75, fullMark: 100 },
    { subject: 'Humidity', A: weather?.humidity || 60, fullMark: 100 },
    { subject: 'Wind', A: Math.min((weather?.windSpeed || 15) * 2, 100), fullMark: 100 },
    { subject: 'UV Index', A: (weather?.uvIndex || 3) * 10, fullMark: 100 },
    { subject: 'Pressure', A: 65, fullMark: 100 },
    { subject: 'AQI Score', A: 80, fullMark: 100 },
  ]

  const accuracyData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    accuracy: 85 + Math.random() * 12 - (i > 20 ? 5 : 0),
    baseline: 75,
  }))

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
      <div className="absolute inset-0 bg-animated-grid opacity-15 pointer-events-none z-[3]" />
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-display text-3xl text-white">
              Climate <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Historical trends & predictive modeling</p>
          </div>
          <div className="flex gap-2">
            {['week','month','year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  period === p ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg Temperature', val: `${weather?.temp ?? '--'}°C`, change: '+2.1°', color: '#00d4ff', icon: TrendingUp },
            { label: 'Total Precipitation', val: `${forecast.reduce((a, b) => a + b.precip, 0).toFixed(1)}mm`, change: '-12%', color: '#06ffd4', icon: Activity },
            { label: 'Max Wind Gust', val: `${Math.max(...forecast.map(d => d.windMax), 0)} km/h`, change: '+8%', color: '#7c3aed', icon: BarChart2 },
            { label: 'Forecast Accuracy', val: '94.2%', change: '+1.3%', color: '#ff0090', icon: Zap },
          ].map(({ label, val, change, color, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 card-hover"
            >
              <div className="flex justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${change.startsWith('+') ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {change}
                </span>
              </div>
              <div className="text-2xl font-bold font-outfit text-white">{val}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Annual Temperature Trend */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-1">Annual Temperature Trends</h3>
            <p className="text-xs text-gray-500 mb-4">Monthly averages with min/max range</p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} unit="°" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="maxTemp" fill="#00d4ff" fillOpacity={0.1} stroke="none" name="Max" unit="°C" />
                <Area type="monotone" dataKey="minTemp" fill="#7c3aed" fillOpacity={0.1} stroke="none" name="Min" unit="°C" />
                <Line type="monotone" dataKey="avgTemp" stroke="#00d4ff" strokeWidth={2.5} dot={false} name="Avg" unit="°C" />
                <Line type="monotone" dataKey="maxTemp" stroke="#06ffd4" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Max" unit="°C" />
                <Line type="monotone" dataKey="minTemp" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Min" unit="°C" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Precipitation */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-1">Precipitation Analysis</h3>
            <p className="text-xs text-gray-500 mb-4">Monthly rainfall distribution (mm)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} unit="mm" />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <Bar dataKey="precip" fill="url(#precipGrad)" radius={[6,6,0,0]} name="Precipitation" unit="mm" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-1">Current Conditions Radar</h3>
            <p className="text-xs text-gray-500 mb-4">Multi-dimensional weather profile</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#888' }} />
                <Radar name="Conditions" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Accuracy */}
          <div className="glass rounded-2xl p-6">
            <h3 className="heading-section text-lg text-white mb-1">AI Forecast Accuracy</h3>
            <p className="text-xs text-gray-500 mb-4">30-day rolling accuracy vs baseline</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06ffd4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06ffd4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="#666" tick={{ fontSize: 9 }} interval={4} />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} unit="%" domain={[70, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accuracy" stroke="#06ffd4" strokeWidth={2} fill="url(#accGrad)" name="AI Accuracy" unit="%" dot={false} />
                <Line type="monotone" dataKey="baseline" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Baseline" unit="%" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-day detailed table */}
        <div className="glass rounded-2xl p-6">
          <h3 className="heading-section text-lg text-white mb-4">7-Day Detailed Forecast</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  {['Day','High','Low','Wind','Precipitation','UV Index','Conditions'].map(h => (
                    <th key={h} className="pb-3 pr-6 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((d, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 pr-6 font-medium text-white">{i === 0 ? 'Today' : d.day}</td>
                    <td className="py-3 pr-6"><span className="text-neon-blue font-semibold">{d.max}°C</span></td>
                    <td className="py-3 pr-6"><span className="text-neon-purple font-semibold">{d.min}°C</span></td>
                    <td className="py-3 pr-6 text-gray-300">{d.wind} km/h</td>
                    <td className="py-3 pr-6">
                      <span className={`px-2 py-1 rounded-full text-xs ${d.precip > 5 ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {d.precip}mm
                      </span>
                    </td>
                    <td className="py-3 pr-6">
                      <span className={`px-2 py-1 rounded-full text-xs ${d.uv >= 6 ? 'bg-red-500/20 text-red-400' : d.uv >= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                        {d.uv}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{forecast[i]?.description || '---'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
