require('dotenv').config()

// ── Terminate Ghost Processes occupying the Server Port ────
if (process.platform === 'win32') {
  try {
    const { execSync } = require('child_process')
    const portToKill = process.env.PORT || 5000
    console.log(`🔍 Checking port ${portToKill} for active conflicts...`)
    const stdout = execSync(`netstat -ano | findstr :${portToKill}`).toString()
    const lines = stdout.split('\n')
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const tokens = line.trim().split(/\s+/)
        const pid = tokens[tokens.length - 1]
        if (pid && pid !== '0' && parseInt(pid) !== process.pid) {
          console.log(`💀 Terminating ghost process ${pid} holding port ${portToKill}...`)
          execSync(`taskkill /F /PID ${pid}`)
        }
      }
    }
  } catch (e) {
    // findstr returns exit code 1 if no matches are found, which throws. Ignore.
  }
}

console.log('📡 ClimateAI Booting... Loaded MONGODB_URI:', process.env.MONGODB_URI || '(not set)')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')

const app = express()
const httpServer = createServer(app)

// ── Socket.IO ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  }
})

// ── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }))
app.use(express.json())

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 })
app.use('/api/', limiter)

// ── Expose io + stress test flags + activity log on app.locals ─
app.locals.io = io
app.locals.stressTest = { enabled: false, latencyMs: 3000, rateLimitChance: 0.5 }
// Activity log ring buffer — max 100 entries across the app
app.locals.activityLog = []

// Global Mock Database Fallbacks (for DB offline development)
const { hashPassword } = require('./utils/authHelper')
app.locals.mockUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    googleId: null,
    name: 'Alex Carter',
    email: 'alex.carter@gmail.com',
    password: hashPassword('password123'),
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    quizStats: { xp: 200, completed: 5, streak: 3 },
    badges: ['Climate Scholar'],
    footprint: 12.4,
    createdAt: new Date(Date.now() - 86400000 * 10),
    lastLogin: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439012',
    googleId: null,
    name: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    password: hashPassword('password123'),
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    quizStats: { xp: 500, completed: 10, streak: 7 },
    badges: ['Eco-Guardian', 'Climate Scholar'],
    footprint: 6.8,
    createdAt: new Date(Date.now() - 86400000 * 30),
    lastLogin: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    googleId: null,
    name: 'Marcus Chen',
    email: 'marcus.chen@gmail.com',
    password: hashPassword('password123'),
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    quizStats: { xp: 80, completed: 2, streak: 1 },
    badges: [],
    footprint: 10.2,
    createdAt: new Date(Date.now() - 86400000 * 2),
    lastLogin: new Date()
  }
]

app.locals.mockCarbonRequests = [
  { _id: 'demo-1', id: 'demo-1', userId: '507f1f77bcf86cd799439011', projectId: 'proj_reforest', amount: 15.0, status: 'pending',  createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { _id: 'demo-2', id: 'demo-2', userId: '507f1f77bcf86cd799439011', projectId: 'proj_wind', amount: 22.0, status: 'approved', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  { _id: 'demo-3', id: 'demo-3', userId: '507f1f77bcf86cd799439012', projectId: 'proj_capture', amount: 8.0, status: 'rejected', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { _id: 'demo-4', id: 'demo-4', userId: '507f1f77bcf86cd799439012', projectId: 'proj_reforest', amount: 31.0, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
]

app.locals.mockScores = [
  { userId: '507f1f77bcf86cd799439011', userName: 'Alex Carter', score: 100, xpGained: 100, createdAt: new Date(Date.now() - 86400000 * 2) },
  { userId: '507f1f77bcf86cd799439011', userName: 'Alex Carter', score: 80, xpGained: 80, createdAt: new Date(Date.now() - 86400000 * 4) },
  { userId: '507f1f77bcf86cd799439012', userName: 'Elena Rostova', score: 90, xpGained: 90, createdAt: new Date(Date.now() - 86400000 * 1) },
  { userId: '507f1f77bcf86cd799439013', userName: 'Marcus Chen', score: 70, xpGained: 70, createdAt: new Date(Date.now() - 86400000 * 3) }
]

app.locals.mockComments = [
  { 
    _id: 'c1',
    id: 'c1',
    articleId: '1', 
    userName: 'Alex Carter', 
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 
    content: 'Incredible news for datacenters. Green grids are the key to absolute clean cloud solutions.', 
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  { 
    _id: 'c2',
    id: 'c2',
    articleId: '2', 
    userName: 'Marcus Chen', 
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 
    content: 'The Arctic telemetry warning radar seems extremely aligned with climate forecast models.', 
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString() 
  }
]

// Stress-test middleware (no-op unless enabled)
app.use(require('./middleware/stressTest'))

// ── Routes ────────────────────────────────────────────────
try {
  app.use('/api/weather', require('./routes/weather'))
  app.use('/api/ai', require('./routes/ai'))
  app.use('/api/alerts', require('./routes/alerts'))
  app.use('/api/admin', require('./routes/admin'))
  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/news', require('./routes/news'))
  app.use('/api/quiz', require('./routes/quiz'))
  app.use('/api/carbon', require('./routes/carbon'))
  app.use('/api/stress', require('./routes/stress'))
  app.use('/api/notifications', require('./routes/notifications'))
  app.use('/api/profile', require('./routes/profile'))
} catch (err) {
  const fs = require('fs')
  fs.writeFileSync('c:\\ClimateAI\\server_error.log', 'ROUTE LOAD ERROR:\n' + err.stack)
  console.error('❌ Route load error, written to server_error.log:', err.message)
  throw err
}


// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      weather_api: 'operational',
      ai_engine: 'operational',
      realtime: 'operational',
      custom_auth: 'active',
    }
  })
})

// ── Socket.IO Real-time ───────────────────────────────────
let connectedClients = 0

io.on('connection', (socket) => {
  connectedClients++
  console.log(`Client connected: ${socket.id} | Total: ${connectedClients}`)

  // Send initial weather update
  socket.emit('weather:update', { message: 'Connected to ClimateAI real-time server', timestamp: Date.now() })

  // Broadcast weather updates every 30s
  const weatherInterval = setInterval(async () => {
    socket.emit('weather:tick', { timestamp: Date.now(), connectedClients })
  }, 30000)

  // Handle location subscription
  socket.on('weather:subscribe', async (data) => {
    console.log('Subscribed to weather:', data)
    socket.join(`weather:${data.lat}:${data.lon}`)
    socket.emit('weather:subscribed', { success: true, location: data })
  })

  // Handle alert subscriptions
  socket.on('alerts:subscribe', (data) => {
    socket.join('alerts')
    socket.emit('alerts:subscribed', { success: true })
  })

  // Handle active user socket registration
  socket.on('user:register', (userData) => {
    socket.userData = userData
    console.log(`👤 Active realtime user registered on socket ${socket.id}: ${userData.email}`)
  })

  // Handle Admin broadcast alert dispatcher
  socket.on('admin:dispatch-alert', async (alertData) => {
    console.log('📢 Admin broadcast dispatched:', alertData)
    io.emit('broadcast:alert', alertData)
    app.locals.activityLog.push({ type: 'alert', event: `Admin broadcast: ${alertData.title || 'Alert'}`, timestamp: Date.now() })
    if (app.locals.activityLog.length > 100) app.locals.activityLog.shift()
    
    // Automatically email all users when Admin broadcasts!
    try {
      const { sendAlertEmailToAllUsers } = require('./utils/emailService')
      await sendAlertEmailToAllUsers(app, {
        title: alertData.title,
        text: alertData.text
      })
    } catch (e) {
      console.error('Failed to broadcast custom alert emails:', e)
    }
  })

  // Handle Admin IoT simulation
  socket.on('admin:simulate-iot', (iotData) => {
    console.log('🎛️ Admin IoT simulation dispatched:', iotData)
    io.emit('broadcast:iot', iotData)
  })

  socket.on('disconnect', () => {
    connectedClients--
    clearInterval(weatherInterval)
    console.log(`Client disconnected: ${socket.id} | Total: ${connectedClients}`)
  })
})

// ── Periodic alert simulation ─────────────────────────────
setInterval(async () => {
  const alerts = [
    { type: 'uv', severity: 'moderate', message: 'UV Index reaching 7+ in metropolitan areas' },
    { type: 'wind', severity: 'high', message: 'Wind gusts expected up to 60 km/h coastal regions' },
    { type: 'rain', severity: 'low', message: 'Scattered showers expected this evening' },
  ]
  const alert = alerts[Math.floor(Math.random() * alerts.length)]
  io.emit('alert:new', { ...alert, timestamp: Date.now() })

  // Automatically email all users when a periodic warning ticks!
  try {
    const { sendAlertEmailToAllUsers } = require('./utils/emailService')
    await sendAlertEmailToAllUsers(app, {
      title: `Meteorological Alert: ${alert.type.toUpperCase()}`,
      text: alert.message
    })
  } catch (e) {
    console.error('Failed to broadcast periodic alert emails:', e)
  }
}, 60000)

// ── MongoDB Connection ────────────────────────────────────
async function connectDB() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      })
      console.log('✅ MongoDB connected')

      // Drop stale unique index on googleId if it exists to allow multiple null/empty registrations
      try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
          const indexes = await db.collection('users').indexes();
          if (indexes.some(idx => idx.name === 'googleId_1')) {
            console.log('⚠️ Found stale unique googleId_1 index on users collection. Dropping it...');
            await db.collection('users').dropIndex('googleId_1');
            console.log('✅ Successfully dropped googleId_1 unique index');
          }
        }
      } catch (idxErr) {
        console.warn('⚠️ Could not check/drop googleId index:', idxErr.message);
      }

    } catch (err) {
      console.warn('⚠️  MongoDB connection failed — running without DB:', err.message)
    }
  } else {
    console.log('ℹ️  No MONGODB_URI set — running without database')
  }
}

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    try {
      const fs = require('fs')
      fs.writeFileSync('c:\\ClimateAI\\server_started.log', `ClimateAI Server running on port ${PORT} at ${new Date().toISOString()}`)
    } catch (e) {
      console.error('Failed to write startup log:', e)
    }
    console.log(`\n🚀 ClimateAI Server running on http://localhost:${PORT}`)
    console.log(`📡 Socket.IO ready for real-time connections`)
    console.log(`🌍 Weather API proxy: /api/weather`)
    console.log(`🤖 AI endpoint: /api/ai`)
    console.log(`🔔 Alerts: /api/alerts`)
    console.log(`⚙️  Admin: /api/admin\n`)
  })
})


module.exports = { app, io }
