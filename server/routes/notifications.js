const express = require('express')
const router = express.Router()

// ── GET Recent Activity Log ──────────────────────────────────
// The activityLog ring buffer is stored on app.locals in index.js
// and populated by all routes when key events happen.
router.get('/', (req, res) => {
  const log = req.app.locals.activityLog || []
  // Return newest first, max 50
  const sorted = [...log].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
  return res.json({ success: true, notifications: sorted })
})

module.exports = router
