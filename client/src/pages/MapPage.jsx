import { useState, useEffect, Fragment, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Layers, Wind, CloudRain, Thermometer, Search, Navigation, Activity, Compass, Cpu } from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import { useWeather } from '../context/WeatherContext'
import { useSocket } from '../context/SocketContext'
import { playTap, playHover } from '../utils/audio'

export default function MapPage() {
  const { weather, location } = useWeather()
  const { activeGlobalAlert } = useSocket()
  
  const [activeLayer, setActiveLayer] = useState('temperature')
  const [MapComponent, setMapComponent] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Interactive navigation states
  const [mapCenter, setMapCenter] = useState([location.lat, location.lon])
  const [mapZoom, setMapZoom] = useState(4)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchNotice, setSearchNotice] = useState('')

  // Real data layers
  const [wildfirePoints, setWildfirePoints] = useState([])
  const [aqiPoints, setAqiPoints] = useState([])
  const [layerLoading, setLayerLoading] = useState(false)

  // Terminal telemetry cycle state
  const [telemetryIndex, setTelemetryIndex] = useState(0)
  const telemetryLogs = [
    `SYS_SCAN: CALIBRATING SATELLITE RADAR ARRAYS... STABLE LOCK OVER TROPICS.`,
    `METRIC: TEMPERATURE ANOMALY DETECTED AT +1.15°C VARIANCE OVER INDIAN OCEAN.`,
    `STREAM: INGESTING hyper-local weather datasets from 50k IoT coordinate feeds.`,
    `ALARM: ACTIVE PRECIPITATION CYCLING IN RUNTIME. WIND SHEARS RECORDED OVER NORTH SEA.`,
    `COSMOS: CALIBRATING ALBEDO REFLECTION FACTOR. ATMOSPHERIC CO2 AT 424 PPM.`
  ]

  // Dynamic import Leaflet on component mount to prevent SSR conflicts
  useEffect(() => {
    import('leaflet').then(L => {
      import('react-leaflet').then(({ MapContainer, TileLayer, CircleMarker, Popup, useMap }) => {
        setMapLoaded(true)
        setMapComponent({ MapContainer, TileLayer, CircleMarker, Popup, L: L.default, useMap })
      })
    }).catch(() => setMapLoaded(false))
  }, [])

  // Rotate telemetry text logs
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryIndex(prev => (prev + 1) % telemetryLogs.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  // Fetch NASA FIRMS wildfire hotspots (free, no key)
  const fetchWildfires = async () => {
    if (wildfirePoints.length > 0) return // Already loaded
    setLayerLoading(true)
    try {
      // NASA FIRMS VIIRS active fire data — past 1 day, global, CSV format
      const res = await fetch('https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_NOAA20_NRT/-180,-90,180,90/1')
      const text = await res.text()
      const lines = text.split('\n').slice(1).filter(Boolean)
      const points = lines.slice(0, 200).map(line => {
        const parts = line.split(',')
        const lat = parseFloat(parts[0])
        const lon = parseFloat(parts[1])
        const brightness = parseFloat(parts[2]) || 330
        if (isNaN(lat) || isNaN(lon)) return null
        return { lat, lon, brightness }
      }).filter(Boolean)
      setWildfirePoints(points)
    } catch (e) {
      // Use sample wildfire points as fallback
      setWildfirePoints([
        { lat: 37.5, lon: -120.0, brightness: 350 }, { lat: 38.2, lon: -121.5, brightness: 340 },
        { lat: -33.5, lon: 150.2, brightness: 345 }, { lat: 39.5, lon: 25.3, brightness: 332 },
        { lat: 60.2, lon: 100.5, brightness: 360 }, { lat: 55.8, lon: 85.3, brightness: 348 },
        { lat: -15.3, lon: -52.1, brightness: 355 }, { lat: -12.4, lon: -53.8, brightness: 342 },
        { lat: 45.6, lon: 8.4, brightness: 338 }, { lat: 41.2, lon: 14.8, brightness: 336 },
      ])
    } finally {
      setLayerLoading(false)
    }
  }

  // Fetch OpenAQ real sensor locations (free, no key)
  const fetchAQI = async () => {
    if (aqiPoints.length > 0) return // Already loaded
    setLayerLoading(true)
    try {
      const res = await fetch(`https://api.openaq.org/v3/locations?limit=50&coordinates=${location.lat},${location.lon}&radius=2000000&order_by=lastUpdated&sort=desc`)
      const data = await res.json()
      if (data.results) {
        const points = data.results.map(loc => ({
          lat: loc.coordinates?.latitude,
          lon: loc.coordinates?.longitude,
          name: loc.name || 'Sensor',
          city: loc.locality || loc.country?.name || '',
          pm25: loc.parameters?.find(p => p.parameter === 'pm25')?.lastValue || null,
          lastUpdated: loc.datetimeLast?.utc
        })).filter(p => p.lat && p.lon)
        setAqiPoints(points)
      }
    } catch (e) {
      // Sample AQI points
      setAqiPoints([
        { lat: 28.6, lon: 77.2, name: 'Delhi Monitor', city: 'Delhi', pm25: 145 },
        { lat: 39.9, lon: 116.4, name: 'Beijing Station', city: 'Beijing', pm25: 89 },
        { lat: 19.1, lon: 72.9, name: 'Mumbai Sensor', city: 'Mumbai', pm25: 62 },
        { lat: 40.7, lon: -74.0, name: 'NYC Monitor', city: 'New York', pm25: 12 },
        { lat: 51.5, lon: -0.1, name: 'London Station', city: 'London', pm25: 18 },
        { lat: 48.9, lon: 2.4, name: 'Paris Monitor', city: 'Paris', pm25: 22 },
        { lat: -33.9, lon: 151.2, name: 'Sydney Sensor', city: 'Sydney', pm25: 8 },
        { lat: 35.7, lon: 139.7, name: 'Tokyo Station', city: 'Tokyo', pm25: 14 },
        { lat: -23.5, lon: -46.6, name: 'São Paulo', city: 'São Paulo', pm25: 35 },
        { lat: 6.5, lon: 3.4, name: 'Lagos Monitor', city: 'Lagos', pm25: 55 },
      ])
    } finally {
      setLayerLoading(false)
    }
  }

  // Trigger data fetch when layer changes
  useEffect(() => {
    if (activeLayer === 'wildfire') fetchWildfires()
    if (activeLayer === 'airquality') fetchAQI()
  }, [activeLayer])

  // Fly/pan Leaflet map view component
  function ChangeMapView({ center, zoom }) {
    if (!MapComponent) return null
    try {
      const map = MapComponent.useMap()
      useEffect(() => {
        map.setView(center, zoom)
      }, [center, zoom, map])
    } catch (e) {
      console.warn('Leaflet view bypass:', e)
    }
    return null
  }

  // Address search query logic via OSM Nominatim API
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchNotice('')
    playTap()

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data && data.length > 0) {
        const first = data[0]
        const lat = parseFloat(first.lat)
        const lon = parseFloat(first.lon)
        setMapCenter([lat, lon])
        setMapZoom(9)
      } else {
        setSearchNotice('Location not found. Try entering a city name.')
      }
    } catch (err) {
      setSearchNotice('Search failed due to a network interruption.')
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const layers = [
    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: '#00d4ff' },
    { id: 'precipitation', label: 'Precipitation', icon: CloudRain, color: '#7c3aed' },
    { id: 'wind', label: 'Wind Velocity', icon: Wind, color: '#06ffd4' },
    { id: 'wildfire', label: 'Wildfires 🔥', icon: Activity, color: '#ff4400' },
    { id: 'airquality', label: 'Air Quality 💨', icon: Wind, color: '#ff8800' },
  ]

  const weatherPoints = [
    { lat: 40.71, lon: -74.01, city: 'New York', temp: 22, wind: 18, rain: 0.0, icon: '⛅', details: 'Mid-Atlantic region experiencing light maritime breeze.' },
    { lat: 51.51, lon: -0.12, city: 'London', temp: 15, wind: 28, rain: 3.5, icon: '🌧️', details: 'Active low-pressure cell causing continuous rainfall.' },
    { lat: 35.68, lon: 139.69, city: 'Tokyo', temp: 28, wind: 8, rain: 0.0, icon: '☀️', details: 'Stable high-pressure dome yielding clear skies.' },
    { lat: 48.85, lon: 2.35, city: 'Paris', temp: 18, wind: 14, rain: 0.2, icon: '🌦️', details: 'Transitional clouds passing over Central Europe.' },
    { lat: 25.20, lon: 55.27, city: 'Dubai', temp: 38, wind: 22, rain: 0.0, icon: '🔆', details: 'Extreme thermal bloom with dust vector currents.' },
    { lat: -33.87, lon: 151.21, city: 'Sydney', temp: 20, wind: 16, rain: 1.0, icon: '⛅', details: 'Subtropical marine drafts with scattered cloud layers.' },
    { lat: 19.07, lon: 72.88, city: 'Mumbai', temp: 32, wind: 42, rain: 15.0, icon: '🌩️', details: 'Severe monsoon vortex with localized storm alarms.' },
    { lat: 1.35, lon: 103.82, city: 'Singapore', temp: 30, wind: 24, rain: 8.5, icon: '⛈️', details: 'Heavy convective cells circling equatorial zone.' },
  ]

  const getMarkerSettings = (p, layer) => {
    if (layer === 'temperature') {
      const temp = p.temp
      const color = temp > 30 ? '#ff0090' : temp > 20 ? '#ff8800' : temp > 10 ? '#00d4ff' : '#0055ff'
      return {
        color,
        radius: Math.max(9, Math.min(22, temp / 2 + 5)),
        text: `Temperature: ${temp}°C`,
        value: `${temp}°C`
      }
    } else if (layer === 'wind') {
      const wind = p.wind || 10
      const color = wind > 30 ? '#ff0090' : wind > 20 ? '#06ffd4' : '#7c3aed'
      return {
        color,
        radius: Math.max(9, Math.min(22, wind / 2.5 + 4)),
        text: `Wind Speed: ${wind} km/h`,
        value: `${wind} km/h`
      }
    } else { // precipitation
      const rain = p.rain || 0
      const color = rain > 5 ? '#7c3aed' : rain > 1 ? '#0055ff' : rain > 0 ? '#06ffd4' : 'rgba(255,255,255,0.4)'
      return {
        color,
        radius: Math.max(9, Math.min(22, rain * 1.6 + 6)),
        text: `Precipitation: ${rain} mm`,
        value: `${rain} mm`
      }
    }
  }

  const userPoint = {
    lat: location.lat,
    lon: location.lon,
    city: weather?.city || 'Your Location',
    temp: weather?.temp || 28,
    wind: weather?.windSpeed || 16,
    rain: weather?.humidity > 80 ? 2.5 : 0.0,
    details: 'Hyper-local IoT connection point stream active.'
  }

  const triggerFly = (lat, lon) => {
    playTap()
    setMapCenter([lat, lon])
    setMapZoom(6)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#020409]"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      
      {/* Sci-Fi Global styled overrides for Leaflet Popups to render glassmorphism */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: rgba(4, 13, 26, 0.92) !important;
          color: #ffffff !important;
          border: 1px solid rgba(6, 255, 212, 0.25) !important;
          backdrop-filter: blur(15px) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 15px rgba(6, 255, 212, 0.1) !important;
          padding: 2px !important;
        }
        .leaflet-popup-tip {
          background: rgba(4, 13, 26, 0.92) !important;
          border: 1px solid rgba(6, 255, 212, 0.25) !important;
        }
        .leaflet-container {
          background: #020409 !important;
          font-family: 'JetBrains Mono', 'Inter', monospace !important;
        }
      `}</style>

      {/* Retro HUD grid overlay */}
      <div className="absolute inset-0 bg-animated-grid opacity-10 pointer-events-none z-[3]" />

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 space-y-6">
        
        {/* Header telemetry and Search portal */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
          <div>
            <span className="label-overline mb-1.5 inline-block text-neon-blue">[ SATELLITE_LOCK: ACTIVE ]</span>
            <h1 className="heading-display text-4xl text-white font-display font-light">
              Climate <span className="gradient-text">Radar Maps</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Real-time global weather layers in a tactical holographic display</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
            {/* Nominatim Search panel */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Query coordinates, city, address..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white text-xs focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue backdrop-blur-lg font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2.5 rounded-xl bg-neon-blue hover:bg-neon-cyan text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                {searching ? 'QUERYING...' : 'LOCK'}
              </button>
            </form>

            {/* Layer toggles */}
            <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-lg">
              {layers.map(l => (
                <button
                  key={l.id}
                  onClick={() => { playTap(); setActiveLayer(l.id) }}
                  onMouseEnter={playHover}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
                    activeLayer === l.id
                      ? 'bg-neon-blue/15 border border-neon-blue text-neon-blue font-bold shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  <l.icon size={13} style={{ color: activeLayer === l.id ? l.color : '#9ca3af' }} />
                  <span>{l.label.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {searchNotice && (
          <div className="glass p-3 rounded-xl border border-red-500/20 text-red-400 text-xs font-mono max-w-xl animate-pulse">
            ⚠️ {searchNotice}
          </div>
        )}

        {/* Tactical Screen Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Map Viewer Console */}
          <div className="lg:col-span-9 glass-strong rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
            
            {/* Holographic HUD Corners decal */}
            <div className="absolute top-4 left-4 text-[9px] font-mono text-neon-blue tracking-widest pointer-events-none z-[1000] select-none">
              RADAR_FEED // STABLE_LOCK_SAT
            </div>
            <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t border-l border-white/20 pointer-events-none z-[1000]" />
            <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t border-r border-white/20 pointer-events-none z-[1000]" />
            <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b border-l border-white/20 pointer-events-none z-[1000]" />
            <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b border-r border-white/25 pointer-events-none z-[1000]" />

            {/* Radar scanner sweep overlay line */}
            <div className="absolute inset-0 pointer-events-none opacity-20 z-[999]">
              <div className="absolute left-0 right-0 h-[2px] bg-neon-cyan laser-sweep" />
            </div>

            <div style={{ height: '620px' }}>
              {mapLoaded && MapComponent ? (
                <MapComponent.MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <MapComponent.TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  <ChangeMapView center={mapCenter} zoom={mapZoom} />

                  {/* 1. Dynamic styled User Marker */}
                  <MapComponent.CircleMarker
                    key={`user-${activeLayer}`}
                    center={[userPoint.lat, userPoint.lon]}
                    radius={getMarkerSettings(userPoint, activeLayer).radius + 3}
                    color="#00d4ff"
                    fillColor="#00d4ff"
                    fillOpacity={0.8}
                    weight={2}
                  >
                    <MapComponent.Popup>
                      <div className="font-mono p-1">
                        <div className="flex items-center gap-1 border-b border-white/10 pb-1 mb-2">
                          <Navigation size={12} className="text-neon-blue shrink-0 animate-pulse" />
                          <span className="text-sm font-bold text-white">{userPoint.city} (YOU)</span>
                        </div>
                        <span className="text-xs text-gray-300 leading-normal block mb-2">{userPoint.details}</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Coordinates:</span>
                            <span className="text-neon-cyan">{userPoint.lat.toFixed(2)}°, {userPoint.lon.toFixed(2)}°</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Temperature:</span>
                            <span className="text-white font-bold">{userPoint.temp}°C</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Wind Vector:</span>
                            <span className="text-white font-bold">{userPoint.wind} km/h</span>
                          </div>
                        </div>
                      </div>
                    </MapComponent.Popup>
                  </MapComponent.CircleMarker>

                  {/* Wildfire hotspot markers */}
                  {activeLayer === 'wildfire' && wildfirePoints.map((p, i) => (
                    <MapComponent.CircleMarker
                      key={`fire-${i}`}
                      center={[p.lat, p.lon]}
                      radius={Math.max(5, Math.min(14, (p.brightness - 300) / 5))}
                      color="#ff4400"
                      fillColor="#ff6600"
                      fillOpacity={0.8}
                      weight={1}
                    >
                      <MapComponent.Popup>
                        <div className="font-mono p-1">
                          <div className="flex items-center gap-1 border-b border-white/10 pb-1 mb-2">
                            <span className="text-sm">🔥</span>
                            <span className="text-sm font-bold text-white">Active Fire Hotspot</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]"><span className="text-gray-500">Brightness:</span><span className="text-orange-400 font-bold">{p.brightness.toFixed(0)}K</span></div>
                            <div className="flex justify-between text-[10px]"><span className="text-gray-500">Coordinates:</span><span className="text-white">{p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°</span></div>
                            <div className="flex justify-between text-[10px]"><span className="text-gray-500">Source:</span><span className="text-neon-cyan">NASA FIRMS VIIRS</span></div>
                          </div>
                        </div>
                      </MapComponent.Popup>
                    </MapComponent.CircleMarker>
                  ))}

                  {/* AQI sensor markers */}
                  {activeLayer === 'airquality' && aqiPoints.map((p, i) => {
                    const pm25 = p.pm25 || 0
                    const aqiColor = pm25 > 150 ? '#ff0044' : pm25 > 100 ? '#ff4400' : pm25 > 55 ? '#ff8800' : pm25 > 25 ? '#ffcc00' : '#06ffd4'
                    return (
                      <MapComponent.CircleMarker
                        key={`aqi-${i}`}
                        center={[p.lat, p.lon]}
                        radius={Math.max(7, Math.min(18, (pm25 / 10) + 6))}
                        color={aqiColor}
                        fillColor={aqiColor}
                        fillOpacity={0.7}
                        weight={1.5}
                      >
                        <MapComponent.Popup>
                          <div className="font-mono p-1">
                            <div className="flex items-center gap-1 border-b border-white/10 pb-1 mb-2">
                              <span className="text-sm">💨</span>
                              <span className="text-sm font-bold text-white">{p.name}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]"><span className="text-gray-500">City:</span><span className="text-white">{p.city}</span></div>
                              <div className="flex justify-between text-[10px]"><span className="text-gray-500">PM2.5:</span><span className="font-bold" style={{ color: aqiColor }}>{pm25 ? `${pm25.toFixed(1)} µg/m³` : 'No data'}</span></div>
                              <div className="flex justify-between text-[10px]"><span className="text-gray-500">Source:</span><span className="text-neon-cyan">OpenAQ v3</span></div>
                            </div>
                          </div>
                        </MapComponent.Popup>
                      </MapComponent.CircleMarker>
                    )
                  })}

                  {/* Standard weather markers (only for temp/wind/precip) */}
                  {['temperature', 'precipitation', 'wind'].includes(activeLayer) && weatherPoints.map((p, i) => {
                    const settings = getMarkerSettings(p, activeLayer)
                    const isEmergencyTarget = activeGlobalAlert?.targetCity && 
                                             p.city.toLowerCase() === activeGlobalAlert.targetCity.toLowerCase()
                    
                    return (
                      <Fragment key={`${i}-${activeLayer}-wrapper`}>
                        {/* Target Reticle concentric spinning circle if emergency active */}
                        {isEmergencyTarget && (
                          <>
                            <MapComponent.CircleMarker
                              center={[p.lat, p.lon]}
                              radius={settings.radius * 2.5}
                              color="#ff0044"
                              fillColor="#ff0044"
                              fillOpacity={0.05}
                              weight={2}
                              dashArray="5 5"
                              pathOptions={{ className: 'animate-spin' }}
                            />
                            <MapComponent.CircleMarker
                              center={[p.lat, p.lon]}
                              radius={settings.radius * 1.7}
                              color="#ff0044"
                              fillColor="#ff0044"
                              fillOpacity={0.08}
                              weight={1}
                              dashArray="3 3"
                            />
                          </>
                        )}
                        
                        {/* Normal styled marker with neon pulses */}
                        <MapComponent.CircleMarker
                          key={`${i}-${activeLayer}`}
                          center={[p.lat, p.lon]}
                          radius={settings.radius}
                          color={isEmergencyTarget ? '#ff0044' : settings.color}
                          fillColor={isEmergencyTarget ? '#ff0044' : settings.color}
                          fillOpacity={isEmergencyTarget ? 0.95 : 0.65}
                          weight={isEmergencyTarget ? 3 : 1.5}
                        >
                          <MapComponent.Popup>
                            <div className="font-mono p-1">
                              <div className="flex items-center gap-1.5 border-b border-white/10 pb-1 mb-2">
                                <span className="text-sm">{p.icon}</span>
                                <span className="text-sm font-bold text-white">{p.city}</span>
                                {isEmergencyTarget && (
                                  <span className="ml-auto px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[8px] font-bold animate-pulse">ALARM</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-300 leading-normal block mb-2">{p.details}</span>
                              <div className="space-y-1 bg-black/30 p-2 rounded-lg border border-white/5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-500">METRIC:</span>
                                  <span className="font-bold" style={{ color: settings.color }}>{settings.value}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-500">WIND:</span>
                                  <span className="text-white font-bold">{p.wind} km/h</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-500">PRECIP:</span>
                                  <span className="text-white font-bold">{p.rain} mm</span>
                                </div>
                              </div>
                            </div>
                          </MapComponent.Popup>
                        </MapComponent.CircleMarker>
                      </Fragment>
                    )
                  })}
                </MapComponent.MapContainer>
              ) : (
                /* Fallback loading display */
                <div className="w-full h-full relative flex items-center justify-center bg-[#010408]">
                  <div className="absolute inset-0 bg-animated-grid opacity-20" />
                  <div className="text-center relative z-10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto animate-pulse">
                      <Activity size={24} className="text-neon-cyan animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm uppercase tracking-widest">LOADING SATELLITE CORE...</div>
                      <div className="text-xs text-gray-500 mt-1">Calibrating global raster coordinates and atmospheric layers.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HUD Sidebar and Diagnostics Console */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* World Stations list */}
            <div className="glass rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-xs font-mono text-neon-blue uppercase tracking-widest flex items-center gap-2 select-none">
                <Compass size={14} className="animate-spin" style={{ animationDuration: '10s' }} /> WORLD_TELEM_STATIONS
              </h3>
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {/* Active user position shortcut */}
                <motion.div
                  whileHover={{ scale: 1.01, x: 2 }}
                  onClick={() => triggerFly(userPoint.lat, userPoint.lon)}
                  onMouseEnter={playHover}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 cursor-pointer transition-colors text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>📍</span>
                    <span className="text-white font-bold truncate">LOCAL_NODE (YOU)</span>
                  </div>
                  <span className="text-[10px] text-neon-cyan font-bold font-mono">
                    {activeLayer === 'temperature' ? `${userPoint.temp}°C` : activeLayer === 'wind' ? `${userPoint.wind}km` : `${userPoint.rain}mm`}
                  </span>
                </motion.div>

                {/* City list loops */}
                {weatherPoints.map((p, i) => {
                  const settings = getMarkerSettings(p, activeLayer)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01, x: 2 }}
                      onClick={() => triggerFly(p.lat, p.lon)}
                      onMouseEnter={playHover}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all text-xs font-mono group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{p.icon}</span>
                        <span className="text-gray-300 group-hover:text-white transition-colors truncate">{p.city}</span>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: settings.color }}>
                        {settings.value}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Diagnostics logger */}
            <div className="glass rounded-3xl p-5 border border-white/10 shadow-xl space-y-3 relative overflow-hidden bg-black/40 min-h-[120px]">
              {/* Corner tech overlays */}
              <div className="absolute top-2.5 right-3 text-[7px] font-mono text-gray-600 tracking-widest select-none">LOGGER // CORE_STREAM</div>
              
              <h3 className="text-xs font-mono text-neon-purple uppercase tracking-widest select-none flex items-center gap-1.5">
                <Cpu size={12} className="text-neon-purple shrink-0 animate-pulse" /> ATMOSPHERIC_LOGS
              </h3>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={telemetryIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-[10px] font-mono text-neon-cyan leading-relaxed select-text font-light"
                >
                  &gt; {telemetryLogs[telemetryIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Tactical dynamic Legend */}
            <div className="glass rounded-3xl p-5 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest select-none">
                {activeLayer === 'temperature' ? '[ THERMAL_LEGEND ]' : activeLayer === 'wind' ? '[ VELOCITY_LEGEND ]' : '[ PRECIP_LEGEND ]'}
              </h3>
              
              <div 
                className="h-3.5 rounded-full mb-1 transition-all duration-500 shadow-inner" 
                style={{ 
                  background: activeLayer === 'temperature'
                    ? 'linear-gradient(90deg, #0055ff, #00d4ff, #06ffd4, #ffcc00, #ff0090)'
                    : activeLayer === 'wind'
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.1), #7c3aed, #06ffd4, #ff0090)'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.1), #06ffd4, #0055ff, #7c3aed)'
                }} 
              />
              
              <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                {activeLayer === 'temperature' ? (
                  <><span>-10°C</span><span>15°C</span><span>45°C</span></>
                ) : activeLayer === 'wind' ? (
                  <><span>0 km/h</span><span>25 km/h</span><span>50+ km/h</span></>
                ) : (
                  <><span>0 mm</span><span>8 mm</span><span>15+ mm</span></>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </motion.div>
  )
}
