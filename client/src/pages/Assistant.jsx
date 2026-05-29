import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Zap, Cloud, Thermometer, Wind } from 'lucide-react'
import { useWeather } from '../context/WeatherContext'
import VideoBackground from '../components/ui/VideoBackground'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const suggestions = [
  "What should I wear today?",
  "Will it rain this weekend?",
  "Is it safe to go hiking tomorrow?",
  "What's the UV risk today?",
  "Give me farming advice for today",
  "Any storm alerts I should know about?",
]

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center mr-3 flex-shrink-0 mt-1 overflow-hidden">
          <img src="/logo.png" alt="AI" className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(0,212,255,0.4)]" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-white'
          : 'glass text-gray-200'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 mb-4"
    >
      <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center overflow-hidden">
        <img src="/logo.png" alt="AI" className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(0,212,255,0.4)]" />
      </div>
      <div className="glass rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-neon-blue"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function Assistant() {
  const { weather, forecast, aqi } = useWeather()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm ClimateAI, your intelligent weather assistant. 🌍\n\nI can help you with:\n• Real-time weather insights\n• Smart clothing & travel recommendations\n• Health & safety alerts\n• Farming and outdoor activity guidance\n\nWhat would you like to know about today's weather?`,
      time: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildSystemPrompt = () => {
    const w = weather
    return `You are ClimateAI, an advanced AI climate and weather assistant. You provide helpful, accurate, and personalized weather insights.

Current Weather Data:
- Location: ${w?.city || 'Unknown'}
- Temperature: ${w?.temp}°C (Feels like: ${w?.feelsLike}°C)
- Condition: ${w?.description}
- Humidity: ${w?.humidity}%
- Wind Speed: ${w?.windSpeed} km/h
- UV Index: ${w?.uvIndex}
- Air Pressure: ${w?.pressure} hPa
- AQI: ${aqi?.aqi || 'N/A'} (${aqi?.category || 'N/A'})

7-Day Forecast Summary:
${forecast.slice(0, 3).map(d => `- ${d.date}: ${d.description}, High ${d.maxTemp}°C / Low ${d.minTemp}°C, Precip: ${d.precip}mm`).join('\n')}

Guidelines:
- Be conversational, helpful, and precise
- Provide actionable recommendations
- Use weather emojis to make responses engaging
- Keep responses concise but informative
- If asked about clothing, health, travel or farming, give specific advice based on the current conditions above`
  }

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return
    const userMsg = { role: 'user', content: text, time: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Fetch from our backend proxy endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            { role: userMsg.role, content: userMsg.content },
          ],
          weatherContext: weather ? {
            city: weather.city,
            temp: weather.temp,
            feelsLike: weather.feelsLike,
            description: weather.description,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            uvIndex: weather.uvIndex,
            aqi: aqi?.aqi,
            aqiCategory: aqi?.category,
          } : null
        }),
      })

      const data = await response.json()
      if (response.ok && data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content, time: Date.now() }])
      } else {
        throw new Error(data.error || 'Failed to fetch AI response')
      }
    } catch (err) {
      console.warn('Backend chat failed — falling back to client-side or demo:', err)
      // Fallback: If client has GROQ_API_KEY, we can try calling Groq directly
      if (GROQ_API_KEY) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: buildSystemPrompt() },
                ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: text },
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          })
          const data = await response.json()
          const reply = data.choices?.[0]?.message?.content || 'I encountered an issue. Please try again.'
          setMessages(prev => [...prev, { role: 'assistant', content: reply, time: Date.now() }])
          setLoading(false)
          return
        } catch (clientErr) {
          console.error('Client-side Groq call also failed:', clientErr)
        }
      }

      // Elegant Demo fallback response matching current weather
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
      const replies = {
        wear: `Based on current conditions (${weather?.temp || 22}°C, ${weather?.description || 'mainly clear'}): ${weather?.temp > 25 ? '👕 Light breathable clothing is perfect. Stay hydrated!' : weather?.temp > 15 ? '🧥 A light jacket would be comfortable today.' : '🧣 Bundle up! Wear warm layers and a scarf.'}`,
        rain: `☔ Looking at the forecast: ${forecast.filter(d => d.precip > 1).length > 0 ? `Rain expected on ${forecast.filter(d => d.precip > 1).map(d => new Date(d.date).toLocaleDateString('en', { weekday: 'short' })).join(', ')}. Keep that umbrella handy!` : 'No significant rain expected this week. Great news for outdoor plans! 🌤️'}`,
        default: `Current conditions in ${weather?.city || 'New York'}: ${weather?.temp || 22}°C with ${weather?.description || 'clear sky'}. UV Index is ${weather?.uvIndex || 3} (${(weather?.uvIndex || 3) >= 6 ? '⚠️ High - apply sunscreen!' : '✅ Safe'}). Wind is ${weather?.windSpeed || 10} km/h. Air quality is ${aqi?.category || 'Good'}. How else can I assist you?`,
      }
      const key = text.toLowerCase().includes('wear') ? 'wear' : text.toLowerCase().includes('rain') ? 'rain' : 'default'
      setMessages(prev => [...prev, { role: 'assistant', content: replies[key], time: Date.now() }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 pb-6 flex flex-col relative overflow-hidden"
    >
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_133010_cb9c806d-bc9d-47f1-ac4c-b1759134ec8b.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-15 pointer-events-none z-[3]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none z-[3]"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 w-full flex flex-col flex-1 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="heading-display text-3xl text-white">
              AI <span className="gradient-text">Assistant</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Voice-enabled climate intelligence</p>
          </div>
          {/* Live weather chip */}
          {weather && (
            <div className="flex items-center gap-3">
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <Thermometer size={14} className="text-neon-blue" />
                <span className="text-sm text-white">{weather.temp}°C</span>
                <span className="text-gray-500">·</span>
                <span className="text-sm text-gray-400">{weather.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="glass-strong rounded-3xl flex flex-col flex-1 overflow-hidden" style={{ minHeight: '60vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            <AnimatePresence>
              {loading && <TypingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs glass px-3 py-1.5 rounded-full text-gray-300 hover:text-neon-blue hover:neon-border-blue transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-3 items-end">
              <div className="flex-1 glass rounded-2xl flex items-center gap-3 px-4 py-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about weather, climate, or smart recommendations..."
                  className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleVoice}
                className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500/20 neon-border-blue' : 'glass'}`}
              >
                {isListening 
                  ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <MicOff size={18} className="text-red-400" />
                    </motion.div>
                  : <Mic size={18} className="text-gray-400 hover:text-neon-blue transition-colors" />
                }
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="btn-primary px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </motion.button>
            </div>
            <div className="text-xs text-gray-600 text-center mt-2">
              {GROQ_API_KEY ? '🟢 Groq AI connected' : '⚠️ Demo mode — Add VITE_GROQ_API_KEY to .env for full AI'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
