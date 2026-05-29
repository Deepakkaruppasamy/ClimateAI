import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export default function PremiumEffectsCore() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [cursorType, setCursorType] = useState('default')
  const [isClicking, setIsClicking] = useState(false)
  const [trail, setTrail] = useState([])
  const [reducedMotion, setReducedMotion] = useState(false)

  const cursorRef = useRef(null)
  const trailTimerRef = useRef(null)

  // 1. Scroll Progress Ribbon Tracker
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    // Check user accessibility reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handleMotionChange = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMotionChange)

    if (mediaQuery.matches) return () => mediaQuery.removeEventListener('change', handleMotionChange)

    // 2. Mouse Move & Custom Trail Telemetry
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      setMousePos({ x: clientX, y: clientY })

      // Generate soft organic trail particles on fast sweeps
      if (Math.random() > 0.75) {
        setTrail(prev => [
          ...prev.slice(-15),
          { id: Math.random(), x: clientX, y: clientY, size: Math.random() * 6 + 2 }
        ])
      }

      // Check hovered elements for premium reactive states
      const target = e.target
      if (!target) return

      const isClickable = target.closest('a, button, [role="button"], input[type="submit"], .btn-primary, .btn-ghost, .leaflet-interactive')
      const isDanger = target.closest('.text-red-400, .bg-red-500, .btn-danger, [title*="Delete"], [title*="Reject"]')
      const isSuccess = target.closest('.text-emerald-400, .text-neon-cyan, .bg-emerald-500, .btn-success, [title*="Approve"]')

      if (isDanger) {
        setCursorType('danger')
      } else if (isSuccess) {
        setCursorType('success')
      } else if (isClickable) {
        setCursorType('clickable')
      } else {
        setCursorType('default')
      }
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })

    // 3. Dynamic Magnetic Attraction Easing (Tesla/Apple Style)
    const magneticInterval = setInterval(() => {
      const magneticElements = document.querySelectorAll('a, button, .btn-primary, .btn-ghost, .magnetic')
      if (magneticElements.length === 0) return

      // Get mouse position relative to elements
      magneticElements.forEach(el => {
        const rect = el.getBoundingClientRect()
        const elCenterX = rect.left + rect.width / 2
        const elCenterY = rect.top + rect.height / 2

        // Calculate distance from cursor to element center
        const distX = mousePos.x - elCenterX
        const distY = mousePos.y - elCenterY
        const distance = Math.hypot(distX, distY)

        // Pull element slightly if cursor gets within 60px bounds
        if (distance < 60) {
          const strength = 0.25 // magnetic force pull factor
          const pullX = distX * strength
          const pullY = distY * strength
          el.style.transform = `translate3d(${pullX}px, ${pullY}px, 0) scale(1.05)`
          el.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.25)'
          el.style.transition = 'none' // remove delay during active lock
        } else {
          // Gently restore state
          el.style.transform = ''
          el.style.boxShadow = ''
          el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
        }
      })
    }, 16) // ~60fps checking frequency

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      clearInterval(magneticInterval)
    }
  }, [mousePos])

  // Periodic particle trail decay
  useEffect(() => {
    if (trail.length === 0) return
    trailTimerRef.current = setTimeout(() => {
      setTrail(prev => prev.slice(1))
    }, 600)
    return () => clearTimeout(trailTimerRef.current)
  }, [trail])

  if (reducedMotion) return null

  // Define cursor aesthetic options
  const cursorColors = {
    default: 'rgba(0, 212, 255, 0.3)',
    clickable: 'rgba(6, 255, 212, 0.4)',
    danger: 'rgba(255, 68, 68, 0.5)',
    success: 'rgba(6, 255, 212, 0.6)'
  }

  const cursorBorders = {
    default: '1px solid rgba(0, 212, 255, 0.5)',
    clickable: '2px solid rgba(6, 255, 212, 0.8)',
    danger: '2px solid rgba(255, 68, 68, 0.9)',
    success: '2px solid rgba(6, 255, 212, 0.9)'
  }

  return (
    <>
      {/* Hide standard cursor on desktop screens when premium cursor is active */}
      <style>{`
        @media (min-width: 768px) {
          body, a, button, input, select, textarea, [role="button"], .leaflet-interactive {
            cursor: none !important;
          }
        }
      `}</style>

      {/* ── Scroll Progress Ribbon ──────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple z-[99999] origin-left"
        style={{ scaleX, boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
      />

      {/* ── Custom Animated Cursor Halo ──────────────────────── */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none rounded-full z-[99999] -translate-x-1/2 -translate-y-1/2 hidden md:block"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          width: cursorType === 'clickable' ? '40px' : isClicking ? '12px' : '24px',
          height: cursorType === 'clickable' ? '40px' : isClicking ? '12px' : '24px',
          background: isClicking ? cursorColors[cursorType] : 'transparent',
          border: cursorBorders[cursorType],
          boxShadow: cursorType === 'clickable' ? '0 0 15px rgba(6, 255, 212, 0.3)' : 'none',
          transition: 'width 0.25s ease-out, height 0.25s ease-out, background 0.25s ease-out, border 0.25s ease-out',
          willChange: 'left, top, width, height'
        }}
      />

      {/* ── Cursor Core Dot ─────────────────────────────────── */}
      <div
        className="fixed pointer-events-none rounded-full z-[99999] -translate-x-1/2 -translate-y-1/2 hidden md:block"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          width: '6px',
          height: '6px',
          background: cursorType === 'danger' ? '#ff4444' : cursorType === 'success' ? '#06ffd4' : '#00d4ff',
          boxShadow: '0 0 6px rgba(0, 212, 255, 0.8)',
          willChange: 'left, top'
        }}
      />

      {/* ── Interactive Particle Trails ─────────────────────── */}
      {trail.map((t, idx) => (
        <div
          key={t.id}
          className="fixed pointer-events-none rounded-full bg-neon-cyan/40 z-[99998] -translate-x-1/2 -translate-y-1/2 animate-float-particles"
          style={{
            left: `${t.x}px`,
            top: `${t.y}px`,
            width: `${t.size}px`,
            height: `${t.size}px`,
            opacity: (idx + 1) / trail.length * 0.7,
            boxShadow: '0 0 8px rgba(6, 255, 212, 0.4)',
            willChange: 'left, top'
          }}
        />
      ))}
    </>
  )
}
