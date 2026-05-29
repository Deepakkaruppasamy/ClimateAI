import { useEffect, useRef } from 'react'
import { useWeather } from '../../context/WeatherContext'

export default function WeatherParticles() {
  const canvasRef = useRef(null)
  const { weatherType } = useWeather()
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let particles = []

    function createParticles() {
      particles = []
      const count = weatherType === 'rain' || weatherType === 'storm' ? 200
        : weatherType === 'snow' ? 120
        : weatherType === 'cloudy' ? 40
        : 80 // stars/clear

      for (let i = 0; i < count; i++) {
        particles.push(createParticle(i))
      }
    }

    function createParticle(i) {
      if (weatherType === 'rain' || weatherType === 'storm') {
        return {
          type: 'rain',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 8 + Math.random() * 8,
          length: 15 + Math.random() * 20,
          opacity: 0.3 + Math.random() * 0.5,
        }
      } else if (weatherType === 'snow') {
        return {
          type: 'snow',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 1 + Math.random() * 4,
          speed: 0.5 + Math.random() * 1.5,
          drift: (Math.random() - 0.5) * 0.5,
          opacity: 0.5 + Math.random() * 0.5,
          angle: 0,
        }
      } else if (weatherType === 'cloudy') {
        return {
          type: 'cloud-particle',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.4,
          radius: 40 + Math.random() * 80,
          speed: 0.2 + Math.random() * 0.5,
          opacity: 0.03 + Math.random() * 0.06,
        }
      } else {
        // Stars for clear weather
        return {
          type: 'star',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          opacity: Math.random(),
          twinkleSpeed: 0.01 + Math.random() * 0.02,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
        }
      }
    }

    function drawLightning() {
      if (weatherType !== 'storm') return
      if (Math.random() > 0.995) {
        ctx.save()
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)'
        ctx.lineWidth = 2
        ctx.shadowColor = '#00d4ff'
        ctx.shadowBlur = 20
        let x = Math.random() * canvas.width
        let y = 0
        ctx.beginPath()
        ctx.moveTo(x, y)
        while (y < canvas.height * 0.7) {
          x += (Math.random() - 0.5) * 60
          y += 30 + Math.random() * 40
          ctx.lineTo(x, y)
        }
        ctx.stroke()
        // Flash overlay
        ctx.fillStyle = 'rgba(0, 212, 255, 0.05)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      }
    }

    createParticles()

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (weatherType === 'storm') drawLightning()

      particles.forEach((p, i) => {
        if (p.type === 'rain') {
          ctx.save()
          ctx.strokeStyle = `rgba(150, 220, 255, ${p.opacity})`
          ctx.lineWidth = 1
          ctx.shadowColor = 'rgba(0, 212, 255, 0.5)'
          ctx.shadowBlur = 2
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - 3, p.y + p.length)
          ctx.stroke()
          ctx.restore()
          p.y += p.speed
          p.x -= 2
          if (p.y > canvas.height) {
            p.y = -20
            p.x = Math.random() * canvas.width
          }
        } else if (p.type === 'snow') {
          ctx.save()
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
          ctx.shadowColor = 'rgba(255,255,255,0.8)'
          ctx.shadowBlur = 4
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          p.y += p.speed
          p.x += Math.sin(p.angle) * p.drift
          p.angle += 0.02
          if (p.y > canvas.height) {
            p.y = -10
            p.x = Math.random() * canvas.width
          }
        } else if (p.type === 'cloud-particle') {
          ctx.save()
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
          grad.addColorStop(0, `rgba(100, 150, 200, ${p.opacity})`)
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          p.x += p.speed
          if (p.x - p.radius > canvas.width) p.x = -p.radius
        } else if (p.type === 'star') {
          p.opacity += p.twinkleSpeed * p.twinkleDir
          if (p.opacity > 1 || p.opacity < 0.1) p.twinkleDir *= -1
          ctx.save()
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
          ctx.shadowColor = `rgba(0, 212, 255, ${p.opacity * 0.3})`
          ctx.shadowBlur = 3
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [weatherType])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  )
}
