import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Zap, Thermometer, BookOpen, Leaf, Bell, Volume2, VolumeX, Trash2 } from 'lucide-react'
import { useWeather } from '../context/WeatherContext'
import { useAuth } from '../context/AuthContext'
import VideoBackground from '../components/ui/VideoBackground'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const QUICK_PROMPTS = [
  { icon: Thermometer, label: 'AQI Risk', text: 'What is my current air quality risk and how does it affect my health today?' },
  { icon: Leaf, label: 'Reduce Footprint', text: 'Based on my carbon footprint, give me 3 specific actions I can take this week to reduce it.' },
  { icon: Bell, label: 'Explain Alert', text: 'Explain the most recent climate alert in my region and what I should do.' },
  { icon: BookOpen, label: 'Climate Tip', text: 'Give me one surprising climate science fact and what it means for daily life.' },
]

function MessageBubble({ msg, onSpeak, speaking }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
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
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-gray-500">
            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {!isUser && (
            <button
              onClick={() => onSpeak(msg.content)}
              className="ml-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-neon-cyan"
              title={speaking ? 'Stop speaking' : 'Read aloud'}
            >
              {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}
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

function AtmosphericBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    const resize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Generate lightweight floating thermal/carbon atmospheric particles
    const particles = []
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 1 + Math.random() * 2.5,
        speed: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 0.15,
        alpha: 0.15 + Math.random() * 0.45,
        twinkle: 0.005 + Math.random() * 0.01,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: Math.random() > 0.6 
          ? 'rgba(6, 255, 212, ' // neon cyan
          : Math.random() > 0.5 
          ? 'rgba(124, 58, 237, ' // neon purple
          : 'rgba(0, 212, 255, ' // neon blue
      })
    }

    const render = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.y -= p.speed
        p.x += Math.sin(p.y * 0.004) * p.drift * 2
        
        // Twinkle opacity smoothly
        p.alpha += p.twinkle * p.twinkleDir
        if (p.alpha > 0.6 || p.alpha < 0.1) p.twinkleDir *= -1

        // Wrap around screen bounds
        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
        }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        ctx.save()
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`
        ctx.shadowColor = p.color.replace(', ', ')')
        ctx.shadowBlur = p.radius * 3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      animationId = requestAnimationFrame(render)
    }

    render()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="absolute inset-0 bg-[#02050e] overflow-hidden -z-10 select-none pointer-events-none">
      {/* 1. Scrolling grid overlay */}
      <div className="absolute inset-0 bg-animated-grid opacity-15" />

      {/* 2. Hardware-Accelerated Drifting Nebula Gradients */}
      <style>{`
        @keyframes drift-nebula-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(80px, 40px) scale(1.15); }
        }
        @keyframes drift-nebula-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-60px, -30px) scale(0.9); }
        }
        .nebula-1 {
          background: radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%);
          animation: drift-nebula-1 25s ease-in-out infinite;
          will-change: transform;
        }
        .nebula-2 {
          background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%);
          animation: drift-nebula-2 30s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
      
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full nebula-1" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full nebula-2" />

      {/* 3. Glowing particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen" />
    </div>
  )
}

export default function Assistant() {
  const { weather, forecast, aqi } = useWeather()
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello${user ? ` ${user.name.split(' ')[0]}` : ''}! I'm ClimateAI, your intelligent weather assistant. 🌍\n\nI can help you with:\n• Real-time weather insights\n• Smart clothing & travel recommendations\n• Health & safety alerts\n• Farming and outdoor activity guidance\n\nWhat would you like to know about today's weather?`,
      time: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.lang = 'en-US'
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // Load chat history on mount
  useEffect(() => {
    if (!user?._id || historyLoaded) return
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/ai/history/${user._id}`)
        const data = await res.json()
        if (res.ok && data.history?.length > 0) {
          const restored = data.history.map(m => ({
            role: m.role,
            content: m.content,
            time: new Date(m.createdAt).getTime()
          }))
          setMessages(prev => [
            prev[0], // keep the greeting
            ...restored
          ])
        }
      } catch (e) { /* silent fail */ } finally {
        setHistoryLoaded(true)
      }
    }
    loadHistory()
  }, [user])

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

    // Save user message to history
    if (user?._id) {
      fetch(`/api/ai/history/${user._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: text })
      }).catch(() => {})
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          } : null,
          // Inject user context for personalized responses
          userContext: user ? {
            name: user.name,
            city: weather?.city,
            footprint: user.footprint,
            badges: user.badges,
            xp: user.quizStats?.xp
          } : null
        }),
      })

      const data = await response.json()
      if (response.ok && data.content) {
        const assistantMsg = { role: 'assistant', content: data.content, time: Date.now() }
        setMessages(prev => [...prev, assistantMsg])
        // Save assistant reply to history
        if (user?._id) {
          fetch(`/api/ai/history/${user._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'assistant', content: data.content })
          }).catch(() => {})
        }
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

  const clearChat = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history?')) return

    if (user?._id) {
      try {
        await fetch(`/api/ai/history/${user._id}`, {
          method: 'DELETE'
        })
      } catch (err) {
        console.error('Failed to clear chat history on server:', err)
      }
    }

    setMessages([
      {
        role: 'assistant',
        content: `Hello${user ? ` ${user.name.split(' ')[0]}` : ''}! I'm ClimateAI, your intelligent weather assistant. 🌍\n\nI can help you with:\n• Real-time weather insights\n• Smart clothing & travel recommendations\n• Health & safety alerts\n• Farming and outdoor activity guidance\n\nWhat would you like to know about today's weather?`,
        time: Date.now(),
      }
    ])
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
      <AtmosphericBackground />

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12 w-full flex flex-col flex-1 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="heading-display text-3xl text-white">
              AI <span className="gradient-text">Assistant</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Voice-enabled climate intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Clear Chat Button */}
            <button
              onClick={clearChat}
              className="glass px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-red-400 hover:neon-border-red transition-all flex items-center gap-2 group cursor-pointer"
              title="Clear entire chat history"
            >
              <Trash2 size={13} className="text-gray-500 group-hover:text-red-400 transition-colors" />
              <span>Clear Chat</span>
            </button>

            {/* Live weather chip */}
            {weather && (
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <Thermometer size={14} className="text-neon-blue" />
                <span className="text-sm text-white">{weather.temp}°C</span>
                <span className="text-gray-500">·</span>
                <span className="text-sm text-gray-400">{weather.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="glass-strong rounded-3xl flex flex-col flex-1 overflow-hidden" style={{ minHeight: '60vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} onSpeak={speak} speaking={isSpeaking} />)}
            <AnimatePresence>
              {loading && <TypingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts — always visible */}
          <div className="px-6 pb-4">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Quick Climate Queries</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p, i) => {
                const Icon = p.icon
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text)}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full text-gray-300 hover:text-neon-blue hover:neon-border-blue transition-all disabled:opacity-50"
                  >
                    <Icon size={11} />
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

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
