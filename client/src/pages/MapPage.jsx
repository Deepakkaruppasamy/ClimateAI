import { useState, useEffect, Fragment } from 'react'
import { motion } from 'framer-motion'
import { Map, Layers, Wind, CloudRain, Thermometer, Search } from 'lucide-react'
import VideoBackground from '../components/ui/VideoBackground'
import { useWeather } from '../context/WeatherContext'
import { useSocket } from '../context/SocketContext'

export default function MapPage() {
  const { weather, location } = useWeather()
  const { activeGlobalAlert } = useSocket()
  const [activeLayer, setActiveLayer] = useState('temperature')
  const [MapComponent, setMapComponent] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      import('react-leaflet').then(({ MapContainer, TileLayer, CircleMarker, Popup, useMap }) => {
        setMapLoaded(true)
        setMapComponent({ MapContainer, TileLayer, CircleMarker, Popup, L: L.default })
      })
    }).catch(() => setMapLoaded(false))
  }, [])

  const layers = [
    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: '#00d4ff' },
    { id: 'precipitation', label: 'Rain', icon: CloudRain, color: '#7c3aed' },
    { id: 'wind', label: 'Wind', icon: Wind, color: '#06ffd4' },
  ]

  const weatherPoints = [
    { lat: 40.71, lon: -74.01, city: 'New York', temp: 22, wind: 18, rain: 0.0, icon: '⛅' },
    { lat: 51.51, lon: -0.12, city: 'London', temp: 15, wind: 28, rain: 3.5, icon: '🌧️' },
    { lat: 35.68, lon: 139.69, city: 'Tokyo', temp: 28, wind: 8, rain: 0.0, icon: '☀️' },
    { lat: 48.85, lon: 2.35, city: 'Paris', temp: 18, wind: 14, rain: 0.2, icon: '🌤️' },
    { lat: 25.20, lon: 55.27, city: 'Dubai', temp: 38, wind: 22, rain: 0.0, icon: '🔆' },
    { lat: -33.87, lon: 151.21, city: 'Sydney', temp: 20, wind: 16, rain: 1.0, icon: '⛅' },
    { lat: 19.07, lon: 72.88, city: 'Mumbai', temp: 32, wind: 42, rain: 15.0, icon: '🌩️' },
    { lat: 1.35, lon: 103.82, city: 'Singapore', temp: 30, wind: 24, rain: 8.5, icon: '⛈️' },
  ]

  const getMarkerSettings = (p, layer) => {
    if (layer === 'temperature') {
      const temp = p.temp
      const color = temp > 30 ? '#ff4444' : temp > 20 ? '#ff8800' : temp > 10 ? '#00d4ff' : '#0055ff'
      return {
        color,
        radius: Math.max(8, Math.min(22, temp / 2 + 5)),
        text: `Temperature: ${temp}°C`,
        value: `${temp}°C`
      }
    } else if (layer === 'wind') {
      const wind = p.wind || 10
      const color = wind > 30 ? '#ff0090' : wind > 20 ? '#06ffd4' : '#7c3aed'
      return {
        color,
        radius: Math.max(8, Math.min(22, wind / 2.5 + 4)),
        text: `Wind Speed: ${wind} km/h`,
        value: `${wind} km/h`
      }
    } else { // precipitation
      const rain = p.rain || 0
      const color = rain > 5 ? '#7c3aed' : rain > 1 ? '#0055ff' : rain > 0 ? '#00d4ff' : 'rgba(255,255,255,0.4)'
      return {
        color,
        radius: Math.max(8, Math.min(22, rain * 1.5 + 6)),
        text: `Precipitation: ${rain} mm`,
        value: `${rain} mm`
      }
    }
  }

  const userPoint = {
    lat: location.lat,
    lon: location.lon,
    city: weather?.city || 'Your Location',
    temp: weather?.temp || 20,
    wind: weather?.windSpeed || 12,
    rain: weather?.humidity > 80 ? 2.5 : 0.0
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-12 relative overflow-hidden"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="heading-display text-3xl text-white">
              Weather <span className="gradient-text">Maps</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Interactive global weather visualization</p>
          </div>
          <div className="flex gap-2">
            {layers.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  activeLayer === l.id
                    ? 'border font-medium'
                    : 'glass text-gray-400 hover:text-white'
                }`}
                style={activeLayer === l.id ? {
                  background: `${l.color}18`, color: l.color, border: `1px solid ${l.color}44`
                } : {}}
              >
                <l.icon size={14} />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="glass-strong rounded-3xl overflow-hidden" style={{ height: '600px' }}>
              {mapLoaded && MapComponent ? (
                <MapComponent.MapContainer
                  center={[location.lat, location.lon]}
                  zoom={3}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <MapComponent.TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap"
                  />
                  {/* Current location marker */}
                  <MapComponent.CircleMarker
                    key={`user-${activeLayer}`}
                    center={[userPoint.lat, userPoint.lon]}
                    radius={getMarkerSettings(userPoint, activeLayer).radius + 4}
                    color={getMarkerSettings(userPoint, activeLayer).color}
                    fillColor={getMarkerSettings(userPoint, activeLayer).color}
                    fillOpacity={0.7}
                    weight={3}
                  >
                    <MapComponent.Popup>
                      <div style={{ background: '#040d1a', color: '#fff', padding: '8px', borderRadius: '8px', border: `1px solid ${getMarkerSettings(userPoint, activeLayer).color}` }}>
                        <strong>{userPoint.city} (You)</strong><br />
                        {activeLayer === 'temperature' ? '🌡️' : activeLayer === 'wind' ? '💨' : '🌧️'} {getMarkerSettings(userPoint, activeLayer).text}
                      </div>
                    </MapComponent.Popup>
                  </MapComponent.CircleMarker>

                  {weatherPoints.map((p, i) => {
                    const settings = getMarkerSettings(p, activeLayer)
                    const isEmergencyTarget = activeGlobalAlert?.targetCity && 
                                             p.city.toLowerCase() === activeGlobalAlert.targetCity.toLowerCase()
                    
                    return (
                      <Fragment key={`${i}-${activeLayer}-wrapper`}>
                        {isEmergencyTarget && (
                          <MapComponent.CircleMarker
                            center={[p.lat, p.lon]}
                            radius={settings.radius * 2.5}
                            color="#ff0044"
                            fillColor="#ff0044"
                            fillOpacity={0.15}
                            weight={2}
                            dashArray="4 4"
                            pathOptions={{ className: 'animate-pulse' }}
                          />
                        )}
                        <MapComponent.CircleMarker
                          key={`${i}-${activeLayer}`}
                          center={[p.lat, p.lon]}
                          radius={settings.radius}
                          color={isEmergencyTarget ? '#ff0044' : settings.color}
                          fillColor={isEmergencyTarget ? '#ff0044' : settings.color}
                          fillOpacity={isEmergencyTarget ? 0.9 : 0.6}
                          weight={isEmergencyTarget ? 3 : 1}
                        >
                        <MapComponent.Popup>
                          <div style={{ background: '#040d1a', color: '#fff', padding: '8px', borderRadius: '8px', border: `1px solid ${isEmergencyTarget ? '#ff0044' : settings.color}` }}>
                            <strong>{p.city}</strong> {p.icon}<br />
                            {activeLayer === 'temperature' ? '🌡️' : activeLayer === 'wind' ? '💨' : '🌧️'} {settings.text}
                            {isEmergencyTarget && (
                              <div className="mt-2 text-[10px] text-red-400 font-mono font-bold uppercase animate-pulse">
                                🚨 ACTIVE ALERT
                              </div>
                            )}
                          </div>
                        </MapComponent.Popup>
                      </MapComponent.CircleMarker>
                      </Fragment>
                    )
                  })}
                </MapComponent.MapContainer>
              ) : (
                /* Fallback visual map when Leaflet not loaded */
                <div className="w-full h-full relative flex items-center justify-center"
                  style={{ background: 'radial-gradient(ellipse at 50% 50%, #001a3a 0%, #020409 100%)' }}>
                  <div className="absolute inset-0 bg-animated-grid opacity-20" />
                  {/* SVG World outline placeholder */}
                  <div className="text-center relative z-10">
                    <div className="text-6xl mb-4">🌍</div>
                    <div className="text-gray-400 text-sm">Map loading...</div>
                    <div className="text-xs text-gray-600 mt-1">Interactive Leaflet map</div>
                  </div>
                  {/* Floating city dots */}
                  {weatherPoints.map((p, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${((p.lon + 180) / 360) * 100}%`,
                        top: `${((90 - p.lat) / 180) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                    >
                      <div className="text-lg">{p.icon}</div>
                      <div 
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap font-mono font-bold"
                        style={{ color: layers.find(l => l.id === activeLayer)?.color }}
                      >
                        {activeLayer === 'temperature' ? `${p.temp}°C` : activeLayer === 'wind' ? `${p.wind}k` : `${p.rain}m`}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Layers size={14} className="text-neon-blue" /> World Weather
              </h3>
              <div className="space-y-2">
                {weatherPoints.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span className="text-sm text-gray-300">{p.city}</span>
                    </div>
                    <span className="text-sm font-bold font-mono" style={{ color: layers.find(l => l.id === activeLayer)?.color }}>
                      {activeLayer === 'temperature' ? `${p.temp}°C` : activeLayer === 'wind' ? `${p.wind} km/h` : `${p.rain} mm`}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Active Layer</h3>
              <div className="space-y-2">
                {layers.map(l => (
                  <div key={l.id} className={`flex items-center gap-2 p-2 rounded-xl text-sm cursor-pointer transition-all ${
                    activeLayer === l.id ? 'text-white' : 'text-gray-500'
                  }`}
                    style={activeLayer === l.id ? { background: `${l.color}15`, border: `1px solid ${l.color}33` } : {}}
                    onClick={() => setActiveLayer(l.id)}
                  >
                    <l.icon size={14} style={{ color: l.color }} />
                    {l.label}
                    {activeLayer === l.id && <span className="ml-auto text-xs" style={{ color: l.color }}>● ACTIVE</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                {activeLayer === 'temperature' ? 'Temperature Scale' : activeLayer === 'wind' ? 'Wind Velocity Scale' : 'Precipitation Scale'}
              </h3>
              <div 
                className="h-4 rounded-full mb-2 transition-all duration-500" 
                style={{ 
                  background: activeLayer === 'temperature'
                    ? 'linear-gradient(90deg, #0055ff, #00d4ff, #06ffd4, #ffcc00, #ff4444)'
                    : activeLayer === 'wind'
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.1), #7c3aed, #06ffd4, #ff0090)'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.1), #00d4ff, #0055ff, #7c3aed)'
                }} 
              />
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                {activeLayer === 'temperature' ? (
                  <><span>-10°C</span><span>15°</span><span>45°C</span></>
                ) : activeLayer === 'wind' ? (
                  <><span>0 km/h</span><span>25</span><span>50+ km/h</span></>
                ) : (
                  <><span>0 mm</span><span>8</span><span>15+ mm</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
