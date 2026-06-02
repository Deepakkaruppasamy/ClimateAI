import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('Initializing AI systems...')

  const phases = [
    'Initializing AI systems...',
    'Connecting to climate sensors...',
    'Loading weather models...',
    'Calibrating predictions...',
    'Ready!',
  ]

  useEffect(() => {
    const steps = [0, 20, 45, 70, 90, 100]
    let i = 0
    const timer = setInterval(() => {
      i++
      if (i < steps.length) {
        setProgress(steps[i])
        setPhase(phases[Math.min(i - 1, phases.length - 1)])
      }
      if (i >= steps.length - 1) {
        clearInterval(timer)
        setTimeout(onComplete, 400)
      }
    }, 400)
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: '#020409' }}
    >
      <div className="absolute inset-0 bg-animated-grid opacity-30" />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0.95, 1.05, 0.95],
            rotate: 360
          }}
          transition={{ 
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            rotate: { repeat: Infinity, duration: 8, ease: 'linear' }
          }}
          className="w-24 h-24 mb-6 relative flex items-center justify-center"
        >
          <img src="/logo.png" alt="ClimateAI Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h1 className="font-outfit text-5xl font-black text-white mb-2">
            Climate<span className="gradient-text">AI</span>
          </h1>
          <p className="text-gray-500 text-sm font-mono tracking-widest uppercase">
            Climate Intelligence Platform v2.0
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-72 mb-6"
        >
          <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00d4ff, #7c3aed)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          <div className="flex justify-between items-center">
            <motion.p
              key={phase}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-mono text-neon-blue"
            >
              {phase}
            </motion.p>
            <span className="text-xs font-mono text-gray-600">{progress}%</span>
          </div>
        </motion.div>

        <div className="relative w-16 h-16">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-neon-blue/20"
              animate={{ rotate: 360 }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: 'linear',
                direction: i % 2 === 0 ? 'normal' : 'reverse',
              }}
              style={{ margin: `${i * 6}px` }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-neon-blue"
              style={{ boxShadow: '0 0 10px #00d4ff' }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
