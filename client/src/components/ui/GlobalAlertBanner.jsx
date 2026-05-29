import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, X } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'

export default function GlobalAlertBanner() {
  const { activeGlobalAlert, setActiveGlobalAlert } = useSocket()

  return (
    <AnimatePresence>
      {activeGlobalAlert && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          className="w-full relative z-[99999] overflow-hidden bg-red-500/10 border-b border-red-500/30 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-start sm:items-center gap-3">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-0.5 sm:mt-0 flex-shrink-0"
            >
              <ShieldAlert size={20} className="text-red-500" />
            </motion.div>
            
            <div className="flex-1 text-sm">
              <span className="font-bold text-red-400 font-mono uppercase tracking-wider mr-2">
                {activeGlobalAlert.title || 'CRITICAL ADVISORY'}:
              </span>
              <span className="text-gray-200">
                {activeGlobalAlert.text}
              </span>
            </div>

            <button
              onClick={() => setActiveGlobalAlert(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          {/* Animated pulsing scanline */}
          <motion.div 
            className="absolute bottom-0 left-0 h-[1px] bg-red-500 w-full"
            initial={{ opacity: 0.2, x: '-100%' }}
            animate={{ opacity: [0.2, 1, 0.2], x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
