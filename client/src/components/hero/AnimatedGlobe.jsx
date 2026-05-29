import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function AnimatedGlobe() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.z = 3

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Globe geometry
    const globeGeo = new THREE.SphereGeometry(1, 64, 64)
    
    // Create canvas texture for the globe
    const texCanvas = document.createElement('canvas')
    texCanvas.width = 1024
    texCanvas.height = 512
    const texCtx = texCanvas.getContext('2d')
    
    // Draw world map simplified
    const gradient = texCtx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#001a2e')
    gradient.addColorStop(0.5, '#002244')
    gradient.addColorStop(1, '#001a2e')
    texCtx.fillStyle = gradient
    texCtx.fillRect(0, 0, 1024, 512)
    
    // Ocean glow
    texCtx.fillStyle = 'rgba(0, 100, 200, 0.3)'
    texCtx.fillRect(0, 0, 1024, 512)
    
    // Landmass dots
    texCtx.fillStyle = 'rgba(0, 212, 255, 0.6)'
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 512
      texCtx.beginPath()
      texCtx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2)
      texCtx.fill()
    }
    
    const texture = new THREE.CanvasTexture(texCanvas)
    
    const globeMat = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.3,
    })
    
    const globe = new THREE.Mesh(globeGeo, globeMat)
    scene.add(globe)

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    })
    const wireGlobe = new THREE.Mesh(globeGeo, wireMat)
    wireGlobe.scale.setScalar(1.002)
    scene.add(wireGlobe)

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(1.08, 64, 64)
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(atmGeo, atmMat))

    // Outer glow ring
    const outerGeo = new THREE.SphereGeometry(1.15, 64, 64)
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(outerGeo, outerMat))

    // Orbit rings
    function createRing(radius, color, opacity) {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.005, 128)
      const ringMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity, side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      return ring
    }
    const ring1 = createRing(1.3, 0x00d4ff, 0.4)
    const ring2 = createRing(1.5, 0x7c3aed, 0.25)
    const ring3 = createRing(1.7, 0x06ffd4, 0.15)
    scene.add(ring1, ring2, ring3)

    // Orbiting dots
    const dotGeo = new THREE.SphereGeometry(0.015, 8, 8)
    const dots = []
    const dotColors = [0x00d4ff, 0x7c3aed, 0x06ffd4, 0xff0090]
    const orbitRadii = [1.3, 1.5, 1.7, 1.4]
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: dotColors[i % 4] })
      const dot = new THREE.Mesh(dotGeo, mat)
      dots.push({ mesh: dot, angle: (i / 8) * Math.PI * 2, radius: orbitRadii[i % 4], speed: 0.005 + i * 0.002, tilt: (Math.random() - 0.5) * 0.5 })
      scene.add(dot)
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0x334466, 1))
    const dirLight = new THREE.DirectionalLight(0x00d4ff, 2)
    dirLight.position.set(5, 3, 5)
    scene.add(dirLight)
    const rimLight = new THREE.DirectionalLight(0x7c3aed, 1)
    rimLight.position.set(-5, -3, -5)
    scene.add(rimLight)

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starPos = []
    for (let i = 0; i < 2000; i++) {
      starPos.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.6 })
    scene.add(new THREE.Points(starGeo, starMat))

    // Mouse interaction
    let mouseX = 0, mouseY = 0
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    let time = 0
    let animationFrameId
    function animate() {
      time += 0.005
      globe.rotation.y += 0.003
      wireGlobe.rotation.y += 0.003

      // Subtle mouse parallax
      globe.rotation.x += (mouseY * 0.2 - globe.rotation.x) * 0.05
      globe.rotation.y += mouseX * 0.001

      ring1.rotation.z = time * 0.5
      ring2.rotation.z = -time * 0.3
      ring3.rotation.z = time * 0.2

      dots.forEach(d => {
        d.angle += d.speed
        d.mesh.position.x = Math.cos(d.angle) * d.radius
        d.mesh.position.y = Math.sin(d.tilt) * d.radius * 0.3
        d.mesh.position.z = Math.sin(d.angle) * d.radius
      })

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', handleResize)
      
      // Cleanup geometries and materials to avoid WebGL memory leaks
      globeGeo.dispose()
      globeMat.dispose()
      wireMat.dispose()
      atmGeo.dispose()
      atmMat.dispose()
      outerGeo.dispose()
      outerMat.dispose()
      starGeo.dispose()
      starMat.dispose()
      texture.dispose()
      
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full" />
}
