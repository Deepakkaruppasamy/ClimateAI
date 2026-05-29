import { useEffect, useRef, useState, useMemo } from 'react'

/**
 * VideoBackground — fullscreen looping video backdrop
 * Supports both mp4 URLs and HLS (.m3u8) streams via hls.js
 *
 * Props:
 *   src        — string | string[]  (single URL or array for crossfade carousel)
 *   overlay    — 'default' | 'dark' | 'none'
 *   kenBurns   — boolean (subtle slow zoom)
 *   grain      — boolean (film grain)
 *   scanlines  — boolean
 *   interval   — ms between video switches when src is an array (default 12000)
 *   className  — extra classes on the wrapper
 */
export default function VideoBackground({
  src,
  overlay = 'default',
  kenBurns = true,
  grain = true,
  scanlines = false,
  interval = 12000,
  className = '',
}) {
  const srcKey = Array.isArray(src) ? src.join(',') : src
  const sources = useMemo(() => {
    return Array.isArray(src) ? src : [src]
  }, [srcKey])
  const [activeIdx, setActiveIdx] = useState(0)
  const [nextIdx, setNextIdx]     = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const videoRefs = useRef([])
  const hlsRefs   = useRef([])
  const timerRef  = useRef(null)

  // ── Attach HLS to a video element if needed ──────────────
  const attachHls = async (videoEl, url) => {
    if (!videoEl || !url) return
    if (url.includes('.m3u8')) {
      const { default: Hls } = await import('hls.js')
      if (Hls.isSupported()) {
        const hls = new Hls({ autoStartLoad: true, lowLatencyMode: false })
        hls.loadSource(url)
        hls.attachMedia(videoEl)
        return hls
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoEl.src = url
      }
    } else {
      videoEl.src = url
    }
    return null
  }

  // ── Mount: attach all video sources ─────────────────────
  useEffect(() => {
    let active = true
    const loadAll = async () => {
      for (let i = 0; i < sources.length; i++) {
        const url = sources[i]
        const el = videoRefs.current[i]
        if (!el) continue
        const hls = await attachHls(el, url)
        if (!active) {
          hls?.destroy()
          continue
        }
        if (hls) hlsRefs.current[i] = hls
        el.muted = true
        el.loop  = sources.length === 1
        if (i === 0) {
          el.play().catch(() => {})
        }
      }
    }
    loadAll()

    return () => {
      active = false
      hlsRefs.current.forEach(hls => hls?.destroy())
    }
  }, [sources])

  // ── Carousel: cycle through multiple videos ───────────────
  useEffect(() => {
    if (sources.length <= 1) return
    timerRef.current = setInterval(() => {
      const next = (activeIdx + 1) % sources.length
      setNextIdx(next)
      setTransitioning(true)

      // Preload & play next
      const nextEl = videoRefs.current[next]
      if (nextEl) {
        nextEl.currentTime = 0
        nextEl.play().catch(() => {})
      }

      // After crossfade, make next the active
      setTimeout(() => {
        setActiveIdx(next)
        setNextIdx(null)
        setTransitioning(false)
        // Pause previous
        videoRefs.current.forEach((el, i) => {
          if (i !== next && el) el.pause()
        })
      }, 1500)
    }, interval)

    return () => clearInterval(timerRef.current)
  }, [activeIdx, interval, sources.length])

  return (
    <div className={`video-bg-container ${className}`}>
      {/* Render a video element per source */}
      {sources.map((url, i) => (
        <video
          key={url}
          ref={el => (videoRefs.current[i] = el)}
          className={`video-bg ${kenBurns ? (i % 2 === 0 ? 'ken-burns' : 'ken-burns-alt') : ''}`}
          autoPlay={i === 0}
          muted
          playsInline
          loop={sources.length === 1}
          preload={i < 2 ? 'auto' : 'none'}
          style={{
            opacity: i === activeIdx ? 1 : (i === nextIdx && transitioning) ? 1 : 0,
            zIndex: i === activeIdx ? 1 : (i === nextIdx && transitioning) ? 2 : 0,
          }}
          onEnded={() => {
            // For single-source non-loop, restart
            if (sources.length === 1) videoRefs.current[0]?.play()
          }}
        />
      ))}

      {/* Overlays */}
      {overlay === 'default' && <div className="video-overlay" />}
      {overlay === 'dark'    && <div className="video-overlay-dark" />}
      {overlay === 'left-vignette' && <div className="video-overlay-left-vignette" />}
      {grain                 && <div className="video-grain" />}
      {scanlines             && <div className="video-scanlines" />}

      {/* Carousel dots */}
      {sources.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {sources.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIdx(i)
                videoRefs.current.forEach((el, j) => {
                  if (j === i) { el.currentTime = 0; el.play().catch(() => {}) }
                  else el.pause()
                })
              }}
              className="w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{
                background: i === activeIdx ? '#00d4ff' : 'rgba(255,255,255,0.3)',
                transform: i === activeIdx ? 'scale(1.5)' : 'scale(1)',
                boxShadow: i === activeIdx ? '0 0 8px #00d4ff' : 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
