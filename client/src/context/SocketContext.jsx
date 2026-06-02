import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import { ShieldAlert, X } from 'lucide-react'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [activeGlobalAlert, setActiveGlobalAlert] = useState(null)
  const [iotSimulationData, setIotSimulationData] = useState(null)

  const playWarningBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(520, ctx.currentTime) 
      gain1.gain.setValueAtTime(0.08, ctx.currentTime)
      osc1.start()
      osc1.stop(ctx.currentTime + 0.15)

      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(740, ctx.currentTime)
        gain2.gain.setValueAtTime(0.08, ctx.currentTime)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.25)
      }, 150)
    } catch (e) {
      console.warn('Audio check:', e)
    }
  }

  useEffect(() => {

    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('📡 Connected to ClimateAI web socket server')
      if (user) {
        socket.emit('user:register', {
          email: user.email,
          name: user.name,
          userId: user._id || user.googleId
        })
      }
    })

    socket.on('broadcast:iot', (data) => {
      console.log('🎛️ IoT Simulation received:', data)
      setIotSimulationData(data)
    })

    socket.on('broadcast:alert', (data) => {
      console.log('🔔 Received broadcast emergency alert:', data)
      playWarningBeep()
      
      setActiveGlobalAlert(data)
      setTimeout(() => {
        setActiveGlobalAlert(prev => prev === data ? null : prev)
      }, 15000)

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          } transition-all duration-300 max-w-sm w-full p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 z-[99999] ${
            data.color || 'border-red-500/30 text-red-400 bg-red-500/10'
          }`}
          style={{
            background: 'rgba(4, 13, 26, 0.92)',
            backdropFilter: 'blur(20px)',
            borderWidth: '1px'
          }}
        >
          <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs uppercase tracking-wider font-mono text-white">
              {data.title || 'Emergency Advisory'}
            </h4>
            <p className="text-gray-300 text-xs mt-1 leading-normal font-sans">
              {data.text}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-[10px] font-mono opacity-60 hover:opacity-100 text-white flex items-center justify-center p-1 rounded-lg hover:bg-white/5"
          >
            <X size={12} />
          </button>
        </div>
      ), {
        duration: 8000,
        position: 'top-center'
      })
    })

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && user) {
      socketRef.current.emit('user:register', {
        email: user.email,
        name: user.name,
        userId: user._id || user.googleId
      })
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, activeGlobalAlert, setActiveGlobalAlert, iotSimulationData }}>
      {children}
    </SocketContext.Provider>
  )
}
