import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useWeather } from '../../context/WeatherContext'

export default function CitySearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const { fetchWeather } = useWeather()
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axios.get(`/api/weather/search?q=${encodeURIComponent(query)}`)
        setResults(res.data)
      } catch {

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
          )
          setResults(res.data.map(r => ({
            name: r.display_name.split(',').slice(0, 2).join(', '),
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
          })))
        } catch {
          setResults([])
        }
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [query])

  const selectCity = (city) => {
    fetchWeather(city.lat, city.lon)
    setQuery(city.name.split(',')[0])
    setOpen(false)
    setResults([])
  }

  return (
    <div className="relative">
      <div className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl">
        {searching
          ? <Loader2 size={16} className="text-neon-blue animate-spin flex-shrink-0" />
          : <Search size={16} className="text-gray-500 flex-shrink-0" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search city..."
          className="bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none w-36"
        />
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 w-72 glass-strong rounded-2xl overflow-hidden z-50 shadow-2xl"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectCity(r)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <MapPin size={14} className="text-neon-blue flex-shrink-0" />
                <span className="text-sm text-gray-300 truncate">{r.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {open && results.length > 0 && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
