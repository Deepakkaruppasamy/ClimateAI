import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export default function PremiumEffectsCore() {
  const [cursorType, setCursorType] = useState('default')
  const [isClicking, setIsClicking] = useState(false)
  const [trail, setTrail] = useState([])
  const [reducedMotion, setReducedMotion] = useState(false)

  const [cursorEnabled, setCursorEnabled] = useState(() => {
    const saved = localStorage.getItem('climateai:premium-cursor-enabled')
    return saved !== 'false' 
  })
  const [magneticEnabled, setMagneticEnabled] = useState(() => {
    const saved = localStorage.getItem('climateai:magnetic-enabled')
    return saved !== 'false' 
  })

  const trailTimerRef = useRef(null)
  const activeMagneticRef = useRef(null)
  const cursorRef = useRef(null)
  const coreRef = useRef(null)
  const rafRef = useRef(null)

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    // 0. Preference Sync Listeners
    const handleCursorPreference = () => {
      const saved = localStorage.getItem('climateai:premium-cursor-enabled')
      setCursorEnabled(saved !== 'false')
    }
    const handleMagneticPreference = () => {
      const saved = localStorage.getItem('climateai:magnetic-enabled')
      setMagneticEnabled(saved !== 'false')
    }

    window.addEventListener('climateai:cursor-preference-updated', handleCursorPreference)
    window.addEventListener('climateai:magnetic-preference-updated', handleMagneticPreference)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handleMotionChange = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMotionChange)

    if (mediaQuery.matches) {
      return () => {
        mediaQuery.removeEventListener('change', handleMotionChange)
        window.removeEventListener('climateai:cursor-preference-updated', handleCursorPreference)
        window.removeEventListener('climateai:magnetic-preference-updated', handleMagneticPreference)
      }
    }

    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0
    const activeMagneticRect = { pageLeft: 0, pageTop: 0, width: 0, height: 0 }

    const updatePosition = () => {

      currentX += (targetX - currentX) * 0.25
      currentY += (targetY - currentY) * 0.25
      

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`
      }
      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`
      }

      const activeEl = activeMagneticRef.current
      if (magneticEnabled && activeEl && activeMagneticRect.width > 0) {
        const elCenterX = activeMagneticRect.pageLeft - window.scrollX + activeMagneticRect.width / 2
        const elCenterY = activeMagneticRect.pageTop - window.scrollY + activeMagneticRect.height / 2

        const distX = targetX - elCenterX
        const distY = targetY - elCenterY
        const distance = Math.hypot(distX, distY)

        if (distance < 80) {
          const strength = 0.35 
          const pullX = distX * strength
          const pullY = distY * strength
          activeEl.style.transform = `translate3d(${pullX}px, ${pullY}px, 0) scale(1.05)`
          activeEl.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.2)'
        } else {

          activeEl.style.transform = ''
          activeEl.style.boxShadow = ''
          activeEl.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease'
          activeMagneticRef.current = null
          activeMagneticRect.width = 0
        }
      }

      rafRef.current = requestAnimationFrame(updatePosition)
    }

    rafRef.current = requestAnimationFrame(updatePosition)

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      targetX = clientX
      targetY = clientY

      if (!cursorEnabled) return 

      if (Math.random() > 0.8) {
        setTrail(prev => [
          ...prev.slice(-10), 
          { id: Math.random(), x: clientX, y: clientY, size: Math.random() * 5 + 2 }
        ])
      }

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

    const handleMouseOver = (e) => {
      if (!magneticEnabled) return
      const target = e.target?.closest?.('a, button, .btn-primary, .btn-ghost, .magnetic')
      if (target) {
        activeMagneticRef.current = target
        target.style.transition = 'none' 
        

        const rect = target.getBoundingClientRect()
        activeMagneticRect.pageLeft = rect.left + window.scrollX
        activeMagneticRect.pageTop = rect.top + window.scrollY
        activeMagneticRect.width = rect.width
        activeMagneticRect.height = rect.height
      }
    }

    const handleMouseOut = (e) => {
      if (!magneticEnabled) return
      const target = e.target?.closest?.('a, button, .btn-primary, .btn-ghost, .magnetic')
      if (target && activeMagneticRef.current === target) {
        target.style.transform = ''
        target.style.boxShadow = ''
        target.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
        activeMagneticRef.current = null
        activeMagneticRect.width = 0
      }
    }

    const handleMouseDown = () => {
      if (cursorEnabled) setIsClicking(true)
    }
    const handleMouseUp = () => {
      if (cursorEnabled) setIsClicking(false)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseover', handleMouseOver, { passive: true })
    window.addEventListener('mouseout', handleMouseOut, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
      window.removeEventListener('mouseout', handleMouseOut)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('climateai:cursor-preference-updated', handleCursorPreference)
      window.removeEventListener('climateai:magnetic-preference-updated', handleMagneticPreference)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [cursorEnabled, magneticEnabled])

  useEffect(() => {
    if (trail.length === 0) return
    trailTimerRef.current = setTimeout(() => {
      setTrail(prev => prev.slice(1))
    }, 600)
    return () => clearTimeout(trailTimerRef.current)
  }, [trail])

  if (reducedMotion) return null

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
      {cursorEnabled && (
        <style>{`
          @media (min-width: 768px) {
            body, a, button, input, select, textarea, [role="button"], .leaflet-interactive {
              cursor: none !important;
            }
          }
        `}</style>
      )}

      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple z-[99999] origin-left"
        style={{ scaleX, boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
      />

      {cursorEnabled && (
        <div
          ref={cursorRef}
          className="fixed pointer-events-none rounded-full z-[99999] hidden md:block"
          style={{
            transform: `translate3d(0px, 0px, 0) translate(-50%, -50%)`,
            width: cursorType === 'clickable' ? '40px' : isClicking ? '12px' : '24px',
            height: cursorType === 'clickable' ? '40px' : isClicking ? '12px' : '24px',
            background: isClicking ? cursorColors[cursorType] : 'transparent',
            border: cursorBorders[cursorType],
            boxShadow: cursorType === 'clickable' ? '0 0 15px rgba(6, 255, 212, 0.3)' : 'none',
            transition: 'width 0.25s ease-out, height 0.25s ease-out, background 0.25s ease-out, border 0.25s ease-out',
            willChange: 'transform, width, height'
          }}
        />
      )}

      {cursorEnabled && (
        <div
          ref={coreRef}
          className="fixed pointer-events-none rounded-full z-[99999] hidden md:block"
          style={{
            transform: `translate3d(0px, 0px, 0) translate(-50%, -50%)`,
            width: '6px',
            height: '6px',
            background: cursorType === 'danger' ? '#ff4444' : cursorType === 'success' ? '#06ffd4' : '#00d4ff',
            boxShadow: '0 0 6px rgba(0, 212, 255, 0.8)',
            willChange: 'transform'
          }}
        />
      )}

      {cursorEnabled && trail.map((t, idx) => (
        <div
          key={t.id}
          className="fixed pointer-events-none rounded-full bg-neon-cyan/40 z-[99998] animate-float-particles"
          style={{
            transform: `translate3d(${t.x}px, ${t.y}px, 0) translate(-50%, -50%)`,
            width: `${t.size}px`,
            height: `${t.size}px`,
            opacity: (idx + 1) / trail.length * 0.7,
            boxShadow: '0 0 8px rgba(6, 255, 212, 0.4)',
            willChange: 'transform'
          }}
        />
      ))}
    </>
  )
}
