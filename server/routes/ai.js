const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const mockChatHistory = {} 

router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const ChatMessage = require('../models/ChatMessage')
      const history = await ChatMessage.find({ userId })
        .sort({ createdAt: 1 })
        .limit(30)
        .select('role content createdAt')
      return res.json({ success: true, history })
    } catch (err) {
      return res.json({ success: true, history: [] })
    }
  } else {
    return res.json({ success: true, history: mockChatHistory[userId] || [], warning: 'DB offline' })
  }
})

router.post('/history/:userId', async (req, res) => {
  const { userId } = req.params
  const { role, content } = req.body
  if (!role || !content) return res.status(400).json({ error: 'Missing role or content' })

  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const ChatMessage = require('../models/ChatMessage')
      const msg = new ChatMessage({ userId, role, content })
      await msg.save()
      return res.json({ success: true })
    } catch (err) {
      return res.json({ success: true, warning: 'Save failed silently' })
    }
  } else {
    if (!mockChatHistory[userId]) mockChatHistory[userId] = []
    mockChatHistory[userId].push({ role, content, createdAt: new Date() })

    if (mockChatHistory[userId].length > 30) mockChatHistory[userId].shift()
    return res.json({ success: true, warning: 'DB offline — saved in memory' })
  }
})

router.delete('/history/:userId', async (req, res) => {
  const { userId } = req.params
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const ChatMessage = require('../models/ChatMessage')
      await ChatMessage.deleteMany({ userId })
      return res.json({ success: true, message: 'Chat history cleared' })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to clear chat history', details: err.message })
    }
  } else {
    mockChatHistory[userId] = []
    return res.json({ success: true, message: 'Chat history cleared in memory' })
  }
})

router.post('/chat', async (req, res) => {
  const { messages, weatherContext, userContext } = req.body

  if (!process.env.GROQ_API_KEY) {
    return res.json({
      role: 'assistant',
      content: `I'm ClimateAI running in demo mode. Add GROQ_API_KEY to .env for full AI capabilities.\n\nCurrent weather: ${weatherContext?.temp}°C, ${weatherContext?.description} in ${weatherContext?.city}.`,
    })
  }

  try {
    const Groq = require('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    let userContextStr = ''
    if (userContext) {
      userContextStr = `
User Profile:
- Name: ${userContext.name || 'Climate User'}
- Location: ${userContext.city || weatherContext?.city || 'Unknown'}
- Carbon Footprint: ${userContext.footprint || 'Not calculated'} tonnes CO₂/year
- Badges Earned: ${userContext.badges?.join(', ') || 'None yet'}
- Quiz XP: ${userContext.xp || 0}
`
    }

    const systemPrompt = `You are ClimateAI, an advanced climate and weather intelligence assistant.
Current Weather: ${JSON.stringify(weatherContext)}${userContextStr}
Personalize responses to this specific user when relevant. Be helpful, precise, and use weather emojis. Keep responses concise.`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
      temperature: 0.7,
    })

    res.json({
      role: 'assistant',
      content: completion.choices[0]?.message?.content || 'Unable to generate response.',
    })
  } catch (err) {
    console.error('Groq AI error:', err.message)
    res.status(500).json({ error: 'AI service unavailable', details: err.message })
  }
})

router.post('/recommendations', async (req, res) => {
  const { weather } = req.body
  const recs = []
  if (weather?.temp > 30) recs.push({ type: 'clothing', emoji: '👕', text: 'Light breathable clothing. Stay hydrated.' })
  else if (weather?.temp < 10) recs.push({ type: 'clothing', emoji: '🧥', text: 'Warm layers essential.' })
  else recs.push({ type: 'clothing', emoji: '👔', text: 'Light jacket or casual wear perfect.' })
  if (weather?.uvIndex >= 6) recs.push({ type: 'health', emoji: '🧴', text: 'High UV! Apply SPF 50+.' })
  if (weather?.windSpeed > 40) recs.push({ type: 'travel', emoji: '✈️', text: 'High winds may cause delays.' })
  recs.push({ type: 'farming', emoji: '🌱', text: 'Conditions suitable for outdoor farming.' })
  res.json({ recommendations: recs })
})

module.exports = router
