import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Smartphone, Eye, Sparkles, Shield, Compass } from 'lucide-react'
import { playTap, playHover } from '../../utils/audio'

// Telemetry synth sounds
const triggerSynthChime = (pitch = 880) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(pitch, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, ctx.currentTime + 0.3)
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.warn('Synth bypass:', e)
  }
}

const HOTSPOTS = [
  {
    id: 'arctic',
    name: 'Arctic Cryosphere Melt Index',
    coords: '78.21° N, 15.63° E',
    metric: '45% Thickness Decay',
    anomaly: '+4.8°C Variance',
    details: 'Thermal feedback loops and decreased albedo index accelerating ice sheet disintegration.',
    x: '50%',
    y: '22%'
  },
  {
    id: 'amazon',
    name: 'Amazon Rainforest Carbon Release',
    coords: '3.46° S, 62.21° W',
    metric: '3200+ Heat Anomalies',
    anomaly: '-12% Humidity Deficit',
    details: 'Severe drought currents turning carbon sink into carbon emission plume vector.',
    x: '35%',
    y: '65%'
  },
  {
    id: 'gulf',
    name: 'Gulf Stream Thermal Inversion',
    coords: '38.50° N, 68.30° W',
    metric: '3.2 Sv Circulation Slowdown',
    anomaly: '+2.85°C Ocean Thermal',
    details: 'Freshwater glacial influx disrupting high-salinity deep convective water pump.',
    x: '40%',
    y: '45%'
  }
]

export default function WebXRHologram() {
  const [activeHotspot, setActiveHotspot] = useState(HOTSPOTS[0])
  const [arPairingActive, setArPairingActive] = useState(false)

  const handleHotspotClick = (h) => {
    triggerSynthChime(h.id === 'arctic' ? 880 : h.id === 'amazon' ? 520 : 660)
    setActiveHotspot(h)
  }

  const togglePairing = () => {
    playTap()
    triggerSynthChime( arPairingActive ? 300 : 980)
    setArPairingActive(!arPairingActive)
  }

  return (
    <div className="glass-strong rounded-3xl p-6 lg:p-8 border border-white/10 relative overflow-hidden bg-black/40 shadow-2xl">
      
      {/* Sci-Fi UI Overlay Overrides */}
      <style>{`
        @keyframes hologram-spin {
          from { transform: rotateY(0deg) rotateX(15deg); }
          to { transform: rotateY(360deg) rotateX(15deg); }
        }
        .hologram-globe {
          animation: hologram-spin 18s linear infinite;
          transform-style: preserve-3d;
        }
        @keyframes radar-ring {
          0% { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .pulse-ring {
          animation: radar-ring 3s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        @keyframes qr-scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .ar-scanline {
          animation: qr-scan 3s linear infinite;
        }
      `}</style>

      {/* Cybernetic Tech Decals */}
      <div className="absolute top-3 left-4 text-[9px] font-mono text-neon-blue tracking-widest pointer-events-none select-none">
        SPATIAL_ENGINE // WEBRTC_STREAM
      </div>
      <div className="absolute top-3 right-4 text-[9px] font-mono text-gray-500 tracking-wider pointer-events-none select-none">
        DEVICE_COMPATIBLE: [VISION_PRO / QUEST_3 / IOS]
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT — Tabletop Holo Viewport (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[460px] bg-black/30 rounded-2xl border border-white/5 overflow-hidden py-10">
          
          {/* Holographic scanner cone (radial background) */}
          <div className="absolute inset-x-0 bottom-0 top-1/4 bg-[radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.06)_0%,transparent_70%)] pointer-events-none" />
          
          {/* Neon active grid lines table plane */}
          <div className="absolute bottom-6 w-[80%] h-[120px] rounded-full border border-neon-blue/30 bg-neon-blue/5 shadow-[0_0_30px_rgba(0,212,255,0.05)] transform rotateX(60deg) flex items-center justify-center pointer-events-none">
            <div className="w-[85%] h-[85%] rounded-full border border-dashed border-neon-blue/20" />
            <div className="w-[50%] h-[50%] rounded-full border border-neon-blue/15" />
            {/* Hologram emitter dot */}
            <div className="w-4 h-4 rounded-full bg-neon-cyan shadow-[0_0_15px_#00d4ff] absolute" />
          </div>

          {/* Interactive AR Camera Screen Frame */}
          <div className="absolute top-3.5 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 text-[9px] font-mono text-neon-cyan select-none pointer-events-none animate-pulse">
            <Eye size={12} />
            <span>AR VIEWPORT SIMULATOR ACTIVE</span>
          </div>

          {/* Floating Tabletop Earth Wireframe Globe */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-16 select-none cursor-grab active:cursor-grabbing">
            
            {/* Ring projection loops */}
            <div className="absolute w-[300px] h-[300px] rounded-full border border-neon-blue/10 pointer-events-none transform rotateX(75deg)" />
            <div className="absolute w-[240px] h-[240px] rounded-full border border-dashed border-neon-blue/20 pointer-events-none transform rotateX(75deg) pulse-ring" />

            {/* Glowing Globe SVG Container */}
            <div className="w-48 h-48 hologram-globe relative flex items-center justify-center">
              
              {/* Outer neon glow sphere */}
              <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/25 shadow-[0_0_35px_rgba(0,212,255,0.15)] pointer-events-none" />

              {/* Wireframe Rotating Globe SVG */}
              <svg className="w-full h-full text-neon-cyan opacity-80" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" />
                {/* Horizontal Latitudinal Lines */}
                <ellipse cx="50" cy="50" rx="48" ry="12" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <ellipse cx="50" cy="50" rx="48" ry="28" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                
                {/* Vertical Longitudinal Curves */}
                <ellipse cx="50" cy="50" rx="14" ry="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <ellipse cx="50" cy="50" rx="32" ry="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

                {/* Simulated Glowing Continent Shapes */}
                <path d="M15 45 C17 38 25 35 30 38 C35 40 40 32 45 35 C50 38 52 48 45 52 C38 55 35 62 25 58 Z" fill="rgba(0,212,255,0.12)" stroke="currentColor" strokeWidth="0.5" />
                <path d="M55 25 C62 22 72 25 78 30 C82 35 75 42 70 45 C65 48 58 45 55 35 Z" fill="rgba(0,212,255,0.08)" stroke="currentColor" strokeWidth="0.5" />
                <path d="M60 60 C65 58 75 62 70 72 C65 82 55 78 60 60 Z" fill="rgba(0,212,255,0.1)" stroke="currentColor" strokeWidth="0.5" />
              </svg>

              {/* Holographic interactive threat vector hotspots on the globe */}
              {HOTSPOTS.map(h => (
                <button
                  key={h.id}
                  onClick={() => handleHotspotClick(h)}
                  className="absolute p-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  style={{ left: h.x, top: h.y }}
                >
                  <span className="relative flex h-3.5 w-3.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      activeHotspot.id === h.id ? 'bg-[#ff0055]' : 'bg-neon-cyan'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border border-white/50 ${
                      activeHotspot.id === h.id ? 'bg-[#ff0055] shadow-[0_0_10px_#ff0055]' : 'bg-neon-cyan shadow-[0_0_10px_#00d4ff]'
                    }`}></span>
                  </span>
                  
                  {/* Miniature tooltip on hover */}
                  <span className="absolute left-1/2 -translate-x-1/2 -top-6 bg-black/85 text-white font-mono text-[7px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {h.name.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT — Dynamic Diagnostic HUD & Mobile Pairing QR (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dynamic Hotspot Diagnostic Frame */}
          <div className="glass rounded-3xl p-5 border border-white/10 bg-black/20 space-y-4">
            
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Compass size={15} className="text-neon-cyan animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-[10px] font-mono text-white uppercase tracking-wider">Holo_Coordinate Diagnostic</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[9px] text-gray-500 block">SELECTED VECTOR:</span>
                <span className="text-white font-bold text-sm">{activeHotspot.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-black/40 p-3.5 rounded-xl border border-white/5 text-[10px]">
                <div>
                  <span className="text-gray-500 block uppercase">Coordinates</span>
                  <span className="text-white font-semibold">{activeHotspot.coords}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase">Climate Metric</span>
                  <span className="text-[#06ffd4] font-semibold">{activeHotspot.metric}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 block uppercase">Delta Deviation</span>
                  <span className="text-red-400 font-semibold">{activeHotspot.anomaly}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 block uppercase">AR Mesh Render</span>
                  <span className="text-neon-cyan">STABLE_MESH</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                {activeHotspot.details}
              </p>
            </div>

          </div>

          {/* Tabletop AR Pairing / Mobile Scan Code */}
          <div className="glass rounded-3xl p-5 border border-white/10 bg-black/20 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={15} className="text-neon-purple animate-pulse" />
                <span className="text-[10px] font-mono text-white uppercase tracking-wider">Spatial Link pairing</span>
              </div>
              
              <button
                onClick={togglePairing}
                onMouseEnter={playHover}
                className="text-[9px] font-mono text-neon-blue uppercase px-2 py-0.5 rounded border border-neon-blue/20 bg-neon-blue/5 hover:bg-neon-blue/10 transition-colors cursor-pointer"
              >
                {arPairingActive ? 'CLOSE_LINK' : 'INITIALIZE_PAIRING'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {arPairingActive ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-neon-purple/20 bg-neon-purple/5"
                >
                  {/* Beautiful Glowing Mock QR Code */}
                  <div className="relative w-28 h-28 bg-[#02050a] p-2.5 rounded-xl border border-neon-purple/30 shrink-0 select-none overflow-hidden shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                    {/* Glowing QR grid scan line */}
                    <div className="absolute left-0 right-0 h-[1.5px] bg-neon-purple ar-scanline z-10" />
                    
                    {/* Mock QR details using simple HTML boxes */}
                    <div className="w-full h-full border border-neon-purple/20 flex flex-wrap gap-1 p-1 opacity-70">
                      {Array.from({ length: 49 }).map((_, i) => {
                        const isSquare = (i < 4 || (i % 7 < 4 && i < 28)) // corner elements
                        const isActive = Math.random() > 0.4 || isSquare
                        return (
                          <div 
                            key={i} 
                            className={`w-2.5 h-2.5 rounded-[1px] transition-all ${
                              isActive ? 'bg-neon-purple' : 'bg-transparent'
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  <div className="font-mono text-[10px] leading-relaxed">
                    <span className="text-white font-bold block mb-1">SCAN QR WITH DEVICE CAMERA</span>
                    <p className="text-gray-400">
                      Binds active climate telemetry coordinates onto local spatial environment. Compatible with Safari (Safari ARQuickLook) and Chrome (WebXR).
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6 text-center border border-dashed border-white/10 rounded-2xl select-none"
                >
                  <Sparkles className="text-gray-600 mx-auto mb-2 animate-bounce" size={18} />
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">LINK DEPAIRED</span>
                  <span className="text-[8px] font-mono text-gray-700 block mt-0.5">Click Initialize Pairing to pair AR wearables</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

    </div>
  )
}
