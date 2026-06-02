import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Globe, Search, ArrowLeft, ZoomIn, ZoomOut, Info, Navigation, Star } from 'lucide-react'
import { playTap, playHover } from '../../utils/audio'

// Planet telemetry index database
const PLANETS = [
  { name: 'Sun', color: '#ffcc00', size: 42, distance: 0, speed: 0, desc: 'Yellow dwarf star at the center of the solar system, holding 99.8% of its entire mass.', stats: { diameter: '1,392,700 km', temp: '5,500 °C (Surface)', mass: '333,000 Earths', orbit: 'N/A' }, facts: ['Core temperature reaches 15 million °C', 'Fuse 600 million tons of hydrogen per second', 'Generates solar wind stream that sweeps space'] },
  { name: 'Mercury', color: '#a1a1a1', size: 9, distance: 75, speed: 0.038, desc: 'The smallest and closest planet to the Sun, lacking any substantial atmosphere.', stats: { diameter: '4,879 km', temp: '-180 to 430 °C', mass: '0.055 Earths', orbit: '88 Earth Days' }, facts: ['A year lasts just 88 Earth days', 'Shrinking slowly as its iron core cools down', 'Highest temperature fluctuations in Solar System'] },
  { name: 'Venus', color: '#e3bb76', size: 13, distance: 110, speed: 0.026, desc: 'Second planet with a toxic, runaway greenhouse atmosphere that traps intense heat.', stats: { diameter: '12,104 km', temp: '465 °C (Average)', mass: '0.815 Earths', orbit: '225 Earth Days' }, facts: ['Hotter than Mercury despite being further away', 'Rotates backwards on its axis (Retrograde)', 'Atmospheric pressure is 92 times that of Earth'] },
  { name: 'Earth', color: '#00d4ff', size: 15, distance: 155, speed: 0.018, desc: 'Our home harbor. The only celestial body known to support life, boasting organic ecosystems.', stats: { diameter: '12,742 km', temp: '-89 to 58 °C', mass: '5.97 × 10²⁴ kg', orbit: '365.25 Days' }, facts: ['Water covers 70.8% of the surface area', 'Magnetosphere protects surface from solar radiation', 'Atmosphere holds life-sustaining Nitrogen/Oxygen balance'] },
  { name: 'Mars', color: '#c1440e', size: 11, distance: 200, speed: 0.013, desc: 'The cold, iron-rich red fourth planet with vast canyons and frozen carbon ice sheets.', stats: { diameter: '6,779 km', temp: '-140 to 20 °C', mass: '0.107 Earths', orbit: '687 Earth Days' }, facts: ['Host to Olympus Mons, the largest solar system volcano', 'Boasts a thin atmosphere of 95% carbon dioxide', 'Vast deposits of underground water ice discovered'] },
  { name: 'Jupiter', color: '#b07f35', size: 28, distance: 255, speed: 0.007, desc: 'The massive gas giant king of the system, orbited by dozens of diverse moons.', stats: { diameter: '139,820 km', temp: '-110 °C', mass: '317.8 Earths', orbit: '11.8 Earth Years' }, facts: ['Great Red Spot is a giant storm wider than Earth', 'Has the strongest planetary magnetic field', 'Acts as a cosmic shield, absorbing heavy asteroid impacts'] },
  { name: 'Saturn', color: '#e2bf7d', size: 23, distance: 310, speed: 0.005, desc: 'A stunning gas giant wrapped in billions of icy orbital rings and high-speed winds.', stats: { diameter: '116,460 km', temp: '-140 °C', mass: '95.2 Earths', orbit: '29.4 Earth Years' }, facts: ['Rings are made of water ice and cosmic dust', 'Density is low enough that it would float in water', 'Titan holds a thick atmosphere with hydrocarbon lakes'] },
  { name: 'Uranus', color: '#88c9f2', size: 17, distance: 360, speed: 0.003, desc: 'A pale blue ice giant tilted nearly 98 degrees completely onto its side.', stats: { diameter: '50,724 km', temp: '-195 °C', mass: '14.5 Earths', orbit: '84 Earth Years' }, facts: ['Rotates on its side like a rolling wheel', 'Has 13 faint, dark rings made of carbon dust', 'Its atmosphere is composed of hydrogen, helium, and methane'] },
  { name: 'Neptune', color: '#3350b5', size: 17, distance: 410, speed: 0.002, desc: 'The most distant wind-swept blue ice giant, freezing under active supersonic storm vectors.', stats: { diameter: '49,244 km', temp: '-200 °C', mass: '17.1 Earths', orbit: '164.8 Earth Years' }, facts: ['Supersonic winds reach speeds of up to 2,100 km/h', 'Deep blue color arises from atmospheric methane absorption', 'Triton is the only large moon with a retrograde orbit'] }
]

// Famous global coordinates on Earth map
const EARTH_LOCATIONS = [
  { name: 'Thekkalur, India', lat: 11.135, lon: 77.228, desc: 'Active Simulated Hyperlocal Node', icon: '📍', active: true },
  { name: 'New York, USA', lat: 40.7128, lon: -74.0060, desc: 'East Coast Operations', icon: '🏙️' },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, desc: 'Western Europe Node', icon: '🌧️' },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, desc: 'Asia-Pacific Core', icon: '⛅' },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, desc: 'Southern Hemisphere Hub', icon: '🌤️' },
  { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, desc: 'Middle East Data Core', icon: '☀️' },
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522, desc: 'European Union Hub', icon: '🌦️' },
  { name: 'Amazon Rainforest, Brazil', lat: -3.4653, lon: -62.2159, desc: 'Carbon Sink Monitoring', icon: '🌳' },
  { name: 'Svalbard Global Seed Vault, Norway', lat: 78.2201, lon: 15.6505, desc: 'Resilience Telemetry Root', icon: '❄️' }
]

export default function CosmosOrrery() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState(null) // planet object
  const [zoomRatio, setZoomRatio] = useState(1.0)
  
  // Earth map specific states
  const [showEarthMap, setShowEarthMap] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [MapComponent, setMapComponent] = useState(null)
  
  const [mapCenter, setMapCenter] = useState([11.135, 77.228]) // Starting at Thekkalur
  const [mapZoom, setMapZoom] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const canvasRef = useRef(null)
  const animFrameIdRef = useRef(null)
  const planetPositionsRef = useRef([])
  const hoveredPlanetNameRef = useRef(null)
  const [hoveredPlanet, setHoveredPlanet] = useState(null)

  // Dynamically load Leaflet for Earth Map View
  useEffect(() => {
    if (showEarthMap && !mapLoaded) {
      import('leaflet').then(L => {
        import('react-leaflet').then(({ MapContainer, TileLayer, Marker, Popup, useMap }) => {
          setMapLoaded(true)
          setMapComponent({ MapContainer, TileLayer, Marker, Popup, L: L.default, useMap })
        })
      }).catch(err => {
        console.error('Failed to dynamically import Leaflet', err)
      })
    }
  }, [showEarthMap, mapLoaded])

  // Custom component inside MapContainer to handle center dynamic updates
  const ChangeMapView = ({ center, zoom }) => {
    if (!MapComponent) return null
    try {
      const map = MapComponent.useMap()
      useEffect(() => {
        map.setView(center, zoom)
      }, [center, zoom, map])
    } catch (e) {
      console.warn('Map hooks bypass', e)
    }
    return null
  }

  // Address search query logic via free Nominatim OpenStreetMap API
  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data && data.length > 0) {
        const first = data[0]
        setMapCenter([parseFloat(first.lat), parseFloat(first.lon)])
        setMapZoom(14)
        playTap()
      } else {
        setSearchError('Location not found. Please try a specific city name.')
      }
    } catch (err) {
      setSearchError('Network error. Unable to query places.')
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  // Direct click selection to zoom into a planet
  const selectPlanet = (planet) => {
    playTap()
    setSelectedPlanet(planet)
    setZoomRatio(1.0)
    
    if (planet && planet.name === 'Earth') {
      // Allow the smooth zoom camera animation to run before revealing the detailed map
      setTimeout(() => {
        setShowEarthMap(true)
      }, 1200)
    } else {
      setShowEarthMap(false)
    }
  }

  const zoomOut = () => {
    playTap()
    if (showEarthMap) {
      setShowEarthMap(false)
    }
    setSelectedPlanet(null)
    setZoomRatio(1.0)
  }

  // Twinkling background space stars generator
  const starsRef = useRef([])
  const generateStars = (w, h) => {
    const stars = []
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.5 + Math.random() * 1.5,
        opacity: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.02
      })
    }
    starsRef.current = stars
  }

  // Core HTML5 Canvas Cosmic Drawing Loop
  useEffect(() => {
    if (!isOpen || showEarthMap) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const handleResize = () => {
      canvas.width = canvas.getBoundingClientRect().width
      canvas.height = canvas.getBoundingClientRect().height
      generateStars(canvas.width, canvas.height)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    let cameraScale = 1.0
    let cameraX = 0
    let cameraY = 0

    const drawLoop = () => {
      if (!ctx || !canvas) return
      
      // Clear space backdrop with rich deep void colors
      ctx.fillStyle = '#010308'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const time = performance.now() * 0.001

      // 1. Draw and Twinkle space stars
      starsRef.current.forEach(star => {
        star.opacity += Math.sin(time * star.twinkleSpeed * 100) * 0.05
        star.opacity = Math.max(0.1, Math.min(1.0, star.opacity))
        ctx.fillStyle = `rgba(255,255,255,${star.opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Camera target zooming easing
      let targetScale = 1.0
      let targetX = 0
      let targetY = 0

      if (selectedPlanet) {
        // Zooming in on a selected planet
        targetScale = selectedPlanet.name === 'Sun' ? 2.5 : selectedPlanet.name === 'Earth' ? 4.5 : 3.8
        targetScale *= zoomRatio
        
        // Find planet's active position to track camera
        const planetState = planetPositionsRef.current.find(p => p.name === selectedPlanet.name)
        if (planetState) {
          // Centering target offset
          targetX = -planetState.relX * targetScale
          targetY = -planetState.relY * targetScale
        }
      } else {
        // Standard full system overview layout
        const maxDist = PLANETS[PLANETS.length - 1].distance
        const sizeLimit = Math.min(canvas.width, canvas.height) * 0.85
        targetScale = (sizeLimit / 2) / maxDist
      }

      // Smooth camera interpolation
      cameraScale += (targetScale - cameraScale) * 0.075
      cameraX += (targetX - cameraX) * 0.075
      cameraY += (targetY - cameraY) * 0.075

      const sunX = cx + cameraX
      const sunY = cy + cameraY

      // Reset registry of active planet position boxes
      const newPlanetPositions = []

      // 3. Draw Planetary orbits
      PLANETS.forEach(planet => {
        if (planet.distance === 0) return // Skip Sun orbit
        
        const orbitRadius = planet.distance * cameraScale
        ctx.beginPath()
        ctx.strokeStyle = hoveredPlanetNameRef.current === planet.name 
          ? 'rgba(6, 255, 212, 0.22)' 
          : 'rgba(255,255,255,0.04)'
        ctx.lineWidth = hoveredPlanetNameRef.current === planet.name ? 1.5 : 1
        
        // Standard concentric circle
        ctx.arc(sunX, sunY, orbitRadius, 0, Math.PI * 2)
        ctx.stroke()
      })

      // 4. Draw Center Sun
      const sunRadius = PLANETS[0].size * cameraScale * 0.6
      
      // Gorgeous golden corona glow
      const coronaGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.8)
      coronaGlow.addColorStop(0, 'rgba(255, 204, 0, 0.95)')
      coronaGlow.addColorStop(0.35, 'rgba(255, 120, 0, 0.45)')
      coronaGlow.addColorStop(1, 'rgba(255, 0, 0, 0)')
      
      ctx.fillStyle = coronaGlow
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius * 2.8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffea6c'
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
      ctx.fill()

      // Registry Sun positions
      newPlanetPositions.push({
        name: 'Sun',
        x: sunX,
        y: sunY,
        relX: 0,
        relY: 0,
        radius: sunRadius
      })

      // 5. Draw Orbiting Planets
      PLANETS.forEach(planet => {
        if (planet.distance === 0) return

        // Compute angle
        const angle = time * planet.speed * 2.5
        const relX = Math.cos(angle) * planet.distance
        const relY = Math.sin(angle) * planet.distance
        
        const px = sunX + relX * cameraScale
        const py = sunY + relY * cameraScale
        const radius = Math.max(3, planet.size * cameraScale * 0.6)

        // Store positions
        newPlanetPositions.push({
          name: planet.name,
          x: px,
          y: py,
          relX,
          relY,
          radius
        })

        // Draw Saturn's Rings first
        if (planet.name === 'Saturn') {
          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(Math.PI / 7)
          ctx.strokeStyle = 'rgba(226, 191, 125, 0.35)'
          ctx.lineWidth = radius * 0.45
          ctx.beginPath()
          ctx.ellipse(0, 0, radius * 2.2, radius * 0.35, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }

        // Draw Planet Body
        ctx.fillStyle = planet.color
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fill()

        // Shadow masking to represent single side light casting from center Sun
        ctx.save()
        ctx.beginPath()
        ctx.arc(px, py, radius + 0.5, 0, Math.PI * 2)
        ctx.clip()
        
        // Calculate angle facing away from Sun
        const shadowAngle = Math.atan2(py - sunY, px - sunX)
        const sx = px + Math.cos(shadowAngle) * (radius * 0.5)
        const sy = py + Math.sin(shadowAngle) * (radius * 0.5)
        
        const shadowGlow = ctx.createRadialGradient(sx, sy, radius * 0.1, sx, sy, radius * 1.5)
        shadowGlow.addColorStop(0, 'rgba(0, 0, 0, 0.0)')
        shadowGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0.75)')
        shadowGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.98)')
        
        ctx.fillStyle = shadowGlow
        ctx.beginPath()
        ctx.arc(px, py, radius * 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Custom Earth atmosphere thin cyan glow
        if (planet.name === 'Earth') {
          ctx.strokeStyle = 'rgba(6, 255, 212, 0.45)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(px, py, radius + 2, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Planet Hover indicator rings
        if (hoveredPlanetNameRef.current === planet.name) {
          ctx.strokeStyle = 'rgba(6, 255, 212, 0.85)'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(px, py, radius + 5, 0, Math.PI * 2)
          ctx.stroke()
          
          // Draw subtle floating planet name label
          ctx.fillStyle = '#ffffff'
          ctx.font = '10px JetBrains Mono, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(planet.name.toUpperCase(), px, py - radius - 10)
        }
      })

      // Update ref registry
      planetPositionsRef.current = newPlanetPositions
      animFrameIdRef.current = requestAnimationFrame(drawLoop)
    }

    drawLoop()

    return () => {
      cancelAnimationFrame(animFrameIdRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, selectedPlanet, zoomRatio, showEarthMap])

  // Mouse hover coordinate check
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let foundHover = null
    planetPositionsRef.current.forEach(p => {
      const dist = Math.hypot(p.x - mx, p.y - my)
      if (dist < p.radius + 15) {
        foundHover = p.name
      }
    })

    if (foundHover !== hoveredPlanetNameRef.current) {
      if (foundHover) playHover()
      hoveredPlanetNameRef.current = foundHover
      const planetObj = PLANETS.find(p => p.name === foundHover)
      setHoveredPlanet(planetObj || null)
    }
  }

  // Click handler to select planet
  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let clickedName = null
    planetPositionsRef.current.forEach(p => {
      const dist = Math.hypot(p.x - mx, p.y - my)
      if (dist < p.radius + 15) {
        clickedName = p.name
      }
    })

    if (clickedName) {
      const planetObj = PLANETS.find(p => p.name === clickedName)
      selectPlanet(planetObj)
    }
  }

  return (
    <>
      {/* ── Spinning Floating Toggle Button ── */}
      <div className="fixed bottom-6 right-6 z-[999]">
        <motion.button
          onClick={() => { playTap(); setIsOpen(true) }}
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ rotate: { duration: 1.5, ease: 'easeInOut' }, scale: { duration: 0.2 } }}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.45)] border border-white/20 overflow-hidden group cursor-pointer"
        >
          {/* Cybernetic Animated SVG Solar System Portal */}
          <div className="absolute inset-0 bg-black/20 z-[2] group-hover:bg-transparent transition-all duration-300 pointer-events-none" />
          
          <svg className="w-8 h-8 z-10 relative pointer-events-none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <style>{`
              @keyframes orbit-cw {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes orbit-ccw {
                0% { transform: rotate(360deg); }
                100% { transform: rotate(0deg); }
              }
              @keyframes pulse-glow {
                0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 4px #00d4ff); }
                50% { opacity: 1.0; filter: drop-shadow(0 0 10px #06ffd4); }
              }
              .orbit-ring {
                fill: none;
                stroke: rgba(255, 255, 255, 0.15);
                stroke-width: 1.5;
              }
              .orbit-node-1 {
                animation: orbit-cw 6s linear infinite;
                transform-origin: 50px 50px;
              }
              .orbit-node-2 {
                animation: orbit-ccw 9s linear infinite;
                transform-origin: 50px 50px;
              }
              .sun-core {
                animation: pulse-glow 3s ease-in-out infinite;
              }
            `}</style>
            
            {/* Sun */}
            <circle cx="50" cy="50" r="12" fill="url(#sunGradient)" className="sun-core" />
            
            {/* Inner Orbit */}
            <circle cx="50" cy="50" r="24" className="orbit-ring" strokeDasharray="3 3" />
            {/* Planet 1 */}
            <g className="orbit-node-1">
              <circle cx="74" cy="50" r="3.5" fill="#00d4ff" filter="drop-shadow(0 0 3px #00d4ff)" />
            </g>

            {/* Outer Orbit */}
            <circle cx="50" cy="50" r="38" className="orbit-ring" />
            {/* Planet 2 */}
            <g className="orbit-node-2">
              <circle cx="50" cy="12" r="4.5" fill="#a78bfa" filter="drop-shadow(0 0 3px #a78bfa)" />
            </g>

            {/* Gradients */}
            <defs>
              <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="30%" stopColor="#ffea6c" />
                <stop offset="100%" stopColor="#ffaa00" />
              </radialGradient>
            </defs>
          </svg>

          {/* Animated cybernetic outer spinner rings */}
          <div className="absolute inset-0.5 rounded-[14px] border border-dashed border-neon-cyan opacity-40 animate-spin z-10 pointer-events-none" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-2 rounded-xl border border-dotted border-white/20 animate-spin z-10 pointer-events-none" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
        </motion.button>
      </div>

      {/* ── Fullscreen Interactive Cosmos Overlay Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[1000] bg-black overflow-hidden flex flex-col justify-between font-body text-white"
          >
            {/* Top Navigation HUD Bar */}
            <div className="relative z-50 h-16 border-b border-white/5 bg-[#020409]/80 backdrop-blur-md px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { playTap(); setIsOpen(false) }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <ArrowLeft size={16} className="text-gray-400" />
                </button>
                <div>
                  <h2 className="text-white text-base font-semibold font-mono tracking-wider flex items-center gap-2 select-none">
                    COSMOS_ORRERY // v1.1
                  </h2>
                  <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block select-none">SYSTEM TELEMETRY & GEO EXPLORER</span>
                </div>
              </div>

              {/* Dynamic status indicators */}
              <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 select-none">
                  <Star size={11} className="text-yellow-400" />
                  <span>SOL_SYS_LOCK: ONLINE</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue animate-pulse select-none">
                  <Globe size={11} />
                  <span>{selectedPlanet ? selectedPlanet.name.toUpperCase() : 'SYSTEM OVERVIEW'}</span>
                </div>
              </div>
            </div>

            {/* Main Interactive Screen Area */}
            <div className="flex-1 relative flex overflow-hidden">
              
              {/* Left HUD Panel: Planet list or Selected planet stats */}
              <div className="w-80 border-r border-white/5 bg-[#020409]/70 backdrop-blur-lg z-20 flex flex-col p-6 space-y-6 overflow-y-auto">
                {!selectedPlanet ? (
                  <>
                    <div>
                      <h3 className="text-sm font-mono text-neon-cyan uppercase tracking-widest mb-1.5 select-none">[ PLANET_INDEX ]</h3>
                      <p className="text-xs text-gray-500 leading-normal">
                        Select any planet directly on the spatial canvas or from the registry below to calibrate and zoom in.
                      </p>
                    </div>

                    {/* Planet selection buttons */}
                    <div className="space-y-2">
                      {PLANETS.map((planet, idx) => (
                        <button
                          key={planet.name}
                          onClick={() => selectPlanet(planet)}
                          onMouseEnter={() => {
                            playHover()
                            hoveredPlanetNameRef.current = planet.name
                          }}
                          onMouseLeave={() => {
                            hoveredPlanetNameRef.current = null
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: planet.color }} />
                            <div>
                              <span className="text-sm font-semibold text-white group-hover:text-neon-blue transition-colors">{planet.name}</span>
                              <span className="text-[9px] font-mono text-gray-500 block">COORD: 0.{idx}5AU</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-gray-600 group-hover:text-neon-cyan transition-colors">ZOOM_IN →</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Planet Details Card */}
                    <div className="space-y-6">
                      <button
                        onClick={zoomOut}
                        className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-center text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ArrowLeft size={12} />
                        <span>ZOOM_OUT_SYSTEM</span>
                      </button>

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ background: selectedPlanet.color }} />
                          <h3 className="text-2xl font-bold font-display text-white">{selectedPlanet.name}</h3>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">{selectedPlanet.desc}</p>
                      </div>

                      {/* Fact table */}
                      <div className="glass rounded-2xl p-4 border border-white/5 font-mono space-y-3">
                        <span className="text-[9px] text-gray-500 uppercase block tracking-wider">[ PHYSICAL_METRICS ]</span>
                        {Object.entries(selectedPlanet.stats).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0 select-text">
                            <span className="text-gray-500 capitalize">{k}</span>
                            <span className="text-white font-bold">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bulleted Facts list */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-mono text-neon-cyan uppercase block tracking-wider select-none">[ HISTORICAL_LOGS ]</span>
                        <ul className="space-y-2.5">
                          {selectedPlanet.facts.map((fact, idx) => (
                            <li key={idx} className="text-xs text-gray-400 leading-normal flex items-start gap-1.5 select-text">
                              <span className="text-neon-cyan select-none">•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Center Screen: Canvas Space or Earth Map */}
              <div className="flex-1 relative bg-[#010308]">
                {/* 1. Canvas Orrery Drawing screen */}
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleMouseMove}
                  onClick={handleCanvasClick}
                  className={`w-full h-full cursor-crosshair transition-opacity duration-700 ${showEarthMap ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                />

                {/* 2. Interactive Zoom controls for Orrery Canvas */}
                {!showEarthMap && (
                  <div className="absolute bottom-6 right-6 z-30 flex gap-2">
                    <button
                      onClick={() => { playTap(); setZoomRatio(prev => Math.min(2.5, prev + 0.15)) }}
                      className="w-10 h-10 rounded-xl border border-white/10 bg-[#020409]/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      onClick={() => { playTap(); setZoomRatio(prev => Math.max(0.4, prev - 0.15)) }}
                      className="w-10 h-10 rounded-xl border border-white/10 bg-[#020409]/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <ZoomOut size={16} />
                    </button>
                  </div>
                )}

                {/* 3. Fully Interactive Zoomed Leaflet Map for Earth (All Places visible) */}
                <AnimatePresence>
                  {showEarthMap && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1.0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="absolute inset-0 z-30 flex flex-col bg-[#040d1a]"
                    >
                      {/* Search Bar Address Query */}
                      <div className="absolute top-4 left-4 right-4 z-[999] flex flex-col sm:flex-row gap-2 max-w-xl">
                        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                          <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search street, city, landmark or coordinates…"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#020409]/90 text-white text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue backdrop-blur-lg"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={searching}
                            className="px-5 py-2.5 rounded-xl bg-neon-blue text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-neon-cyan transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            {searching ? 'SEARCHING…' : 'SEARCH'}
                          </button>
                        </form>

                        <button
                          onClick={zoomOut}
                          className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#020409]/90 hover:bg-white/5 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 transition-all backdrop-blur-lg cursor-pointer"
                        >
                          <ArrowLeft size={12} />
                          <span>OUT_TO_SPACE</span>
                        </button>
                      </div>

                      {/* Map Error Banner */}
                      {searchError && (
                        <div className="absolute top-18 left-4 right-4 z-[999] max-w-xl glass p-3 rounded-xl border border-red-500/20 text-red-400 text-xs font-mono select-none">
                          🚨 {searchError}
                        </div>
                      )}

                      {/* Leaflet Map rendering */}
                      {mapLoaded && MapComponent ? (
                        <MapComponent.MapContainer
                          center={mapCenter}
                          zoom={mapZoom}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={true}
                        >
                          <MapComponent.TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                          />
                          <ChangeMapView center={mapCenter} zoom={mapZoom} />

                          {/* Render custom pre-loaded search pins for detailed location checks */}
                          {EARTH_LOCATIONS.map((loc) => (
                            <MapComponent.Marker
                              key={loc.name}
                              position={[loc.lat, loc.lon]}
                            >
                              <MapComponent.Popup>
                                <div style={{ background: '#040d1a', color: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.3)', width: '190px' }}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-base">{loc.icon}</span>
                                    <strong className="text-white text-sm block font-display">{loc.name}</strong>
                                  </div>
                                  <span className="text-[10px] font-mono text-neon-cyan block mt-0.5 uppercase tracking-wide">{loc.desc}</span>
                                  {loc.active && (
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-neon-blue/20 text-neon-blue border border-neon-blue/30 text-[8px] font-mono font-bold animate-pulse">
                                      CURRENT HYPERLOCAL NODE
                                    </span>
                                  )}
                                </div>
                              </MapComponent.Popup>
                            </MapComponent.Marker>
                          ))}
                        </MapComponent.MapContainer>
                      ) : (
                        /* Dynamic loading state */
                        <div className="w-full h-full flex flex-col items-center justify-center relative"
                          style={{ background: 'radial-gradient(ellipse at 50% 50%, #001a3a 0%, #020409 100%)' }}>
                          <div className="absolute inset-0 bg-animated-grid opacity-20" />
                          <div className="text-center relative z-10 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center mx-auto animate-pulse">
                              <Globe className="text-neon-cyan animate-spin" style={{ animationDuration: '4s' }} />
                            </div>
                            <div>
                              <div className="text-white font-mono text-sm uppercase tracking-widest">LOADING WORLD MAP TELEMETRY…</div>
                              <div className="text-xs text-gray-500 mt-1">Calibrating global raster coordinates. All street places will be zoomable.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Map Sidebar locations index overlays */}
                      <div className="absolute bottom-4 left-4 z-[999] max-w-sm hidden md:block">
                        <div className="glass-strong rounded-2xl p-4 border border-white/10 shadow-2xl space-y-3 backdrop-blur-md max-h-[300px] overflow-y-auto custom-scrollbar">
                          <span className="text-[9px] font-mono text-neon-blue uppercase tracking-widest block select-none">[ TELEMETRY_STATION_INDEX ]</span>
                          <div className="space-y-1.5">
                            {EARTH_LOCATIONS.map((loc) => (
                              <button
                                key={loc.name}
                                onClick={() => {
                                  playTap()
                                  setMapCenter([loc.lat, loc.lon])
                                  setMapZoom(13)
                                }}
                                className="w-full text-left p-2 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 flex items-center justify-between text-xs transition-colors cursor-pointer"
                              >
                                <span className="text-gray-300 font-medium truncate">{loc.name}</span>
                                <span className="text-[9px] font-mono text-neon-cyan">{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom Cybernetic Telemetry Stat Bar */}
            <div className="h-10 border-t border-white/5 bg-[#020409] px-6 flex items-center justify-between text-[10px] font-mono text-gray-600 select-none z-20">
              <span>SAT_LINK: ONLINE // SECURE_LOGGED</span>
              <span>ORRERY COORD ANOMALY SHIFT: 0.00%</span>
              <span>GPS_REF: WGS_84 // EPSG_3857</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
