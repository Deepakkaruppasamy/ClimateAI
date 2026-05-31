const express = require('express')
const router = express.Router()
const webpush = require('web-push')
const User = require('../models/User')

// VAPID keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-3qIX7EoKMT1Iws291-qfAc'
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'N_fO-G8mQvX1pXQ037Vq_F0N-3V_TjS2DpxK-0lYwE8'

webpush.setVapidDetails('mailto:test@climateai.com', publicVapidKey, privateVapidKey)

// ── GET Recent Activity Log ──────────────────────────────────
// The activityLog ring buffer is stored on app.locals in index.js
// and populated by all routes when key events happen.
router.get('/', (req, res) => {
  const log = req.app.locals.activityLog || []
  // Return newest first, max 50
  const sorted = [...log].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
  return res.json({ success: true, notifications: sorted })
})

// ── GET Vapid Public Key ─────────────────────────────────────
router.get('/vapidPublicKey', (req, res) => {
  res.send(publicVapidKey)
})

// ── POST Subscribe to Push ───────────────────────────────────
router.post('/subscribe', async (req, res) => {
  const subscription = req.body.subscription
  const userId = req.body.userId // Passed from client

  if (!subscription) return res.status(400).json({ error: 'No subscription object provided' })

  if (userId && userId !== 'mock') {
    try {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { pushSubscriptions: subscription }
      })
      console.log(`✅ Push subscription saved for user ${userId}`)
      res.status(201).json({ success: true })
    } catch (err) {
      console.error('❌ Failed to save push subscription:', err)
      res.status(500).json({ error: 'Database error' })
    }
  } else {
    // Save to memory for mock/anonymous
    req.app.locals.mockSubscriptions = req.app.locals.mockSubscriptions || []
    req.app.locals.mockSubscriptions.push(subscription)
    console.log(`✅ Push subscription saved in memory for anonymous user`)
    res.status(201).json({ success: true, warning: 'Saved to memory' })
  }
})

// ── POST Send Test Push ──────────────────────────────────────
router.post('/test', async (req, res) => {
  const { title, message, userId } = req.body
  const payload = JSON.stringify({ title, body: message })

  try {
    let subs = []
    if (userId && userId !== 'mock') {
      const user = await User.findById(userId)
      if (user && user.pushSubscriptions) subs = user.pushSubscriptions
    } else {
      subs = req.app.locals.mockSubscriptions || []
    }

    if (!subs.length) {
      return res.status(404).json({ error: 'No active push subscriptions found' })
    }

    const sendPromises = subs.map(sub => webpush.sendNotification(sub, payload).catch(e => console.error('Push delivery failed', e)))
    await Promise.all(sendPromises)
    
    res.status(200).json({ success: true, sentCount: subs.length })
  } catch (err) {
    console.error('❌ Push error:', err)
    res.status(500).json({ error: 'Failed to send push' })
  }
})

module.exports = router
