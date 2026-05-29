const express = require('express')
const router = express.Router()

// ── AI Chat Endpoint (Groq) ────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, weatherContext } = req.body

  if (!process.env.GROQ_API_KEY) {
    return res.json({
      role: 'assistant',
      content: `I'm ClimateAI running in demo mode. Add GROQ_API_KEY to .env for full AI capabilities.\n\nCurrent weather: ${weatherContext?.temp}°C, ${weatherContext?.description} in ${weatherContext?.city}.`,
    })
  }

  try {
    const Groq = require('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const systemPrompt = `You are ClimateAI, an advanced climate and weather intelligence assistant.
Current Weather: ${JSON.stringify(weatherContext)}
Be helpful, precise, and use weather emojis. Keep responses concise.`

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

// ── AI Recommendations ─────────────────────────────────────
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
