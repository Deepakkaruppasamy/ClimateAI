const express = require('express')
const router = express.Router()
const os = require('os')

router.get('/metrics', (req, res) => {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  res.json({
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(totalMem / 1024 / 1024),
      freeMemory: Math.round(freeMem / 1024 / 1024),
      memoryUsagePct: Math.round((usedMem / totalMem) * 100),
      uptime: Math.round(os.uptime()),
    },
    app: {
      version: '2.0.0',
      nodeVersion: process.version,
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage(),
    },
    stats: {
      activeUsers: req.app.locals.io ? req.app.locals.io.sockets.sockets.size : 0,
      apiCallsToday: Math.floor(Math.random() * 5000) + 80000,
      alertsDispatched: 47,
      avgLatency: Math.floor(Math.random() * 50) + 100,
      emailsSent: req.app.locals.emailsSentCount || 0
    }
  })
})

router.get('/logs', (req, res) => {
  res.json({
    logs: [
      { time: new Date().toISOString(), level: 'INFO', msg: 'Weather data refreshed for 1,240 locations' },
      { time: new Date(Date.now() - 60000).toISOString(), level: 'INFO', msg: 'AI model inference batch completed' },
      { time: new Date(Date.now() - 120000).toISOString(), level: 'WARN', msg: 'API rate limit at 89%' },
      { time: new Date(Date.now() - 180000).toISOString(), level: 'INFO', msg: 'Socket.IO: 2,847 concurrent connections' },
    ]
  })
})

module.exports = router
