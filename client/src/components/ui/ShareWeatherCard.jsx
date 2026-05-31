import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, Sun, Wind, Droplets, Eye, Gauge, Download, Share2, X, Copy, Twitter, Facebook } from 'lucide-react'
import { useWeather } from '../../context/WeatherContext'
import toast from 'react-hot-toast'

function WeatherCardPreview({ weather, aqi }) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const getConditionIcon = () => {
    const code = weather?.code || 0
    if (code >= 200 && code < 300) return '⛈️'
    if (code >= 300 && code < 600) return '🌧️'
    if (code >= 600 && code < 700) return '❄️'
    if (code >= 700 && code < 800) return '🌫️'
    if (code === 800) return '☀️'
    if (code > 800) return '⛅'
    return '🌤️'
  }

  return (
    <div
      id="weather-share-card"
      className="rounded-3xl overflow-hidden relative select-none"
      style={{
        width: '360px',
        minHeight: '240px',
        background: 'linear-gradient(135deg, #040d1a 0%, #0a1628 50%, #0d0a2e 100%)',
        border: '1px solid rgba(0,212,255,0.25)',
        boxShadow: '0 0 40px rgba(0,212,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)' }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              <span style={{ fontSize: '10px', color: '#00d4ff', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ClimateAI Live</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', lineHeight: 1.1 }}>{weather?.city || 'Unknown City'}</h2>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{dateStr}</p>
          </div>
          <div style={{ fontSize: '48px', lineHeight: 1 }}>{getConditionIcon()}</div>
        </div>

        {/* Main Temp */}
        <div className="flex items-end gap-3 mb-5">
          <span style={{ fontSize: '60px', fontWeight: '300', color: '#00d4ff', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {weather?.temp ?? '--'}°
          </span>
          <div style={{ paddingBottom: '10px' }}>
            <p style={{ fontSize: '14px', color: '#d1d5db', textTransform: 'capitalize' }}>{weather?.description || 'Clear sky'}</p>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>Feels like {weather?.feelsLike ?? '--'}°C</p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {[
            { icon: '💧', label: 'Humidity', val: `${weather?.humidity ?? '--'}%` },
            { icon: '💨', label: 'Wind', val: `${weather?.windSpeed ?? '--'} km/h` },
            { icon: '☀️', label: 'UV Index', val: weather?.uvIndex ?? '--' },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>{icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{val}</div>
              <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* AQI bar */}
        {aqi && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Air Quality Index</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: aqi.aqi < 50 ? '#06ffd4' : aqi.aqi < 100 ? '#ffcc00' : '#ff4444' }}>
                AQI {aqi.aqi} — {aqi.category}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'monospace' }}>climateai.app</span>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'monospace' }}>{timeStr}</span>
        </div>
      </div>
    </div>
  )
}

export default function ShareWeatherCard({ onClose }) {
  const { weather, aqi } = useWeather()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`Check out the weather in ${weather?.city}: ${weather?.temp}°C, ${weather?.description} — via ClimateAI`)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`🌡️ Current weather in ${weather?.city}: ${weather?.temp}°C with ${weather?.description}. UV Index: ${weather?.uvIndex}. Tracked with ClimateAI 🌍 #ClimateAI #Weather`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      const el = document.getElementById('weather-share-card')
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 })
      const link = document.createElement('a')
      link.download = `climateai-weather-${weather?.city || 'card'}.png`
      link.href = canvas.toDataURL()
      link.click()
      toast.success('Weather card downloaded!')
    } catch (err) {
      // Fallback: try native share
      toast.error('Download unavailable. Try sharing the link instead.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-strong rounded-3xl p-6 border border-white/10 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-lg">Share Weather Card</h2>
            <p className="text-gray-500 text-xs">Share your current weather snapshot</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-6">
          <WeatherCardPreview weather={weather} aqi={aqi} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass hover:bg-white/10 transition-all text-gray-300 hover:text-white"
          >
            <Download size={18} />
            <span className="text-xs">Download</span>
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-sm ${
              copied ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : 'glass text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Copy size={18} />
            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleShareTwitter}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-400 transition-all text-gray-300 border border-transparent"
          >
            <Twitter size={18} />
            <span className="text-xs">Twitter</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
