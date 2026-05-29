const express = require('express')
const axios = require('axios')
const router = express.Router()

// ── Current + Forecast Weather (Open-Meteo) ───────────────
router.get('/current', async (req, res) => {
  const { lat = 40.7128, lon = -74.0060 } = req.query
  try {
    let weatherRes;
    try {
      weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat, longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index',
          daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,uv_index_max,wind_speed_10m_max,sunrise,sunset',
          forecast_days: 7, timezone: 'auto',
        }
      })
    } catch (weatherErr) {
      console.error('❌ Open-Meteo weather fetch failure:', weatherErr.message)
      return res.status(500).json({ error: 'Failed to fetch weather data' })
    }

    let city = 'Unknown'
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: { 'User-Agent': 'ClimateAI/2.0 (contact@climateai.org)' },
        timeout: 3000
      })
      if (geoRes.data && geoRes.data.address) {
        const addr = geoRes.data.address
        city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state || 'Unknown'
      }
    } catch (geoErr) {
      console.warn('⚠️ Nominatim reverse geocoding failed (using fallback city name):', geoErr.message)
    }
    const curr = weatherRes.data.current
    const daily = weatherRes.data.daily

    res.json({
      current: {
        temp: Math.round(curr.temperature_2m),
        feelsLike: Math.round(curr.apparent_temperature),
        humidity: curr.relative_humidity_2m,
        windSpeed: Math.round(curr.wind_speed_10m),
        windDir: curr.wind_direction_10m,
        pressure: Math.round(curr.surface_pressure),
        uvIndex: curr.uv_index,
        code: curr.weather_code,
        city, lat: parseFloat(lat), lon: parseFloat(lon),
      },
      forecast: daily.time.map((date, i) => ({
        date,
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        code: daily.weather_code[i],
        precip: daily.precipitation_sum[i] || 0,
        uvMax: daily.uv_index_max[i],
        windMax: Math.round(daily.wind_speed_10m_max[i]),
        sunrise: daily.sunrise[i],
        sunset: daily.sunset[i],
      }))
    })
  } catch (err) {
    console.error('Weather API error:', err.message)
    res.status(500).json({ error: 'Failed to fetch weather data' })
  }
})

// ── AQI (simulated — integrate OpenAQ for production) ─────
router.get('/aqi', async (req, res) => {
  const { lat, lon } = req.query
  res.json({
    aqi: Math.floor(Math.random() * 80) + 20,
    category: 'Good',
    pm25: (Math.random() * 15 + 5).toFixed(1),
    pm10: (Math.random() * 30 + 10).toFixed(1),
    o3: (Math.random() * 50 + 20).toFixed(1),
    no2: (Math.random() * 20 + 5).toFixed(1),
    source: 'OpenAQ (simulated)',
  })
})

// ── Search City ───────────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'Query required' })
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { 'User-Agent': 'ClimateAI/2.0' } }
    )
    res.json(response.data.map(r => ({
      name: r.display_name.split(',').slice(0, 2).join(','),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    })))
  } catch (err) {
    res.status(500).json({ error: 'Search failed' })
  }
})

module.exports = router
