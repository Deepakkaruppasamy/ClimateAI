const express = require('express')
const router = express.Router()

// GET current stress test status
router.get('/status', (req, res) => {
  const flags = req.app.locals.stressTest || { enabled: false, latencyMs: 3000, rateLimitChance: 0.5 }
  return res.json({ success: true, flags })
})

// POST toggle/update stress test flags
router.post('/toggle', (req, res) => {
  const { enabled, latencyMs, rateLimitChance } = req.body
  req.app.locals.stressTest = {
    enabled: typeof enabled === 'boolean' ? enabled : false,
    latencyMs: typeof latencyMs === 'number' ? latencyMs : 3000,
    rateLimitChance: typeof rateLimitChance === 'number' ? rateLimitChance : 0.5,
  }

  // Emit socket event so all admin dashboards stay in sync
  if (req.app.locals.io) {
    req.app.locals.io.emit('admin:stress-test-updated', req.app.locals.stressTest)
  }

  console.log('⚙️  Stress test flags updated:', req.app.locals.stressTest)
  return res.json({ success: true, flags: req.app.locals.stressTest })
})

module.exports = router
