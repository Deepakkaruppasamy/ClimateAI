import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Leaf, Trophy, Globe } from 'lucide-react'

export default function ShareCard({ type = 'quiz', value, label, userName, badge, extraLines = [] }) {
  const cardRef = useRef(null)

  const typeConfig = {
    quiz:   { icon: Trophy, color: '#ffcc00', gradient: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', title: 'Quiz Score', emoji: '🏆' },
    carbon: { icon: Leaf,   color: '#06ffd4', gradient: 'from-emerald-500/20 to-cyan-500/20',  border: 'border-emerald-500/30', title: 'Carbon Footprint', emoji: '🌿' },
    city:   { icon: Globe,  color: '#00d4ff', gradient: 'from-blue-500/20 to-purple-500/20',   border: 'border-blue-500/30',    title: 'City Climate Score', emoji: '🌍' },
  }[type] || typeConfig.quiz

  const Icon = typeConfig.icon

  const handleDownload = async () => {
    try {

      if (window.html2canvas) {
        const canvas = await window.html2canvas(cardRef.current, {
          backgroundColor: '#070a13',
          scale: 2,
          useCORS: true,
        })
        const link = document.createElement('a')
        link.download = `climateai-${type}-${Date.now()}.png`
        link.href = canvas.toDataURL()
        link.click()
      } else {

        handleCopyText()
      }
    } catch (e) {
      handleCopyText()
    }
  }

  const handleCopyText = () => {
    const text = [
      `${typeConfig.emoji} My ClimateAI ${typeConfig.title}: ${value}`,
      label ? `📊 ${label}` : '',
      badge ? `🏅 Badge: ${badge}` : '',
      ...extraLines,
      '',
      '🌍 Track your climate impact at ClimateAI',
    ].filter(Boolean).join('\n')

    navigator.clipboard?.writeText(text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3"
    >
      <div
        ref={cardRef}
        className={`relative rounded-2xl border ${typeConfig.border} bg-gradient-to-br ${typeConfig.gradient} p-6 overflow-hidden`}
        style={{ background: 'linear-gradient(135deg, #070a13 0%, #0d1222 100%)' }}
      >
        <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none" />

        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/20" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/20" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/20" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/20" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${typeConfig.color}20`, border: `1px solid ${typeConfig.color}30` }}>
                <Icon size={14} style={{ color: typeConfig.color }} />
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{typeConfig.title}</span>
            </div>
            <span className="text-[9px] font-mono text-gray-600 tracking-widest">CLIMATEAI.IO</span>
          </div>

          <div>
            <div className="text-4xl font-bold font-mono" style={{ color: typeConfig.color, textShadow: `0 0 20px ${typeConfig.color}40` }}>
              {value}
            </div>
            {label && <div className="text-xs text-gray-400 mt-0.5 font-mono">{label}</div>}
          </div>

          {extraLines.length > 0 && (
            <div className="space-y-0.5">
              {extraLines.map((line, i) => (
                <div key={i} className="text-xs text-gray-400 font-mono">{line}</div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 overflow-hidden">
                <img src="/logo.png" alt="ClimateAI" className="w-full h-full object-contain opacity-70" />
              </div>
              <span className="text-xs text-white font-semibold">{userName || 'Climate Champion'}</span>
            </div>
            {badge && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: typeConfig.color, background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}30` }}>
                🏅 {badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-mono transition-all"
        >
          <Download size={13} />
          Download Card
        </button>
        <button
          onClick={handleCopyText}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-mono transition-all"
          style={{ background: `${typeConfig.color}10`, borderColor: `${typeConfig.color}30`, color: typeConfig.color }}
        >
          <Share2 size={13} />
          Copy & Share
        </button>
      </div>
    </motion.div>
  )
}
