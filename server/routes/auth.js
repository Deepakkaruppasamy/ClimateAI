const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const User = require('../models/User')
const { hashPassword, verifyPassword, generateAvatar } = require('../utils/authHelper')

// ── In-Memory Database Fallback (Utilizes global app.locals.mockUsers) ─────

// Helper to filter out sensitive password hashes
const serializeUser = (user) => {
  const serialized = user.toObject ? user.toObject() : { ...user }
  delete serialized.password
  return serialized
}

// ── Register User ───────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const hashedPassword = hashPassword(password)
  const avatarUrl = generateAvatar(name)

  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email: normalizedEmail })
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' })
      }

      const isAdminEmail = ['elena.rostova@gmail.com', 'deep@gmail.com', 'deepakk.23it@kongu.edu'].includes(normalizedEmail)
      const newUser = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        avatar: avatarUrl,
        role: isAdminEmail ? 'admin' : 'user',
        googleId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
      })

      await newUser.save()
      console.log(`👤 User registered in MongoDB: ${newUser.email}`)
      return res.status(201).json({ success: true, user: serializeUser(newUser) })
    } catch (err) {
      console.error('❌ Database user registration failed:', err.message)
      return res.status(500).json({ error: 'Database error occurred during registration', details: err.message })
    }
  } else {
    // MongoDB offline: check in-memory registry
    const mockUsers = req.app.locals.mockUsers || []
    const existingMock = mockUsers.find(u => u.email === normalizedEmail)
    if (existingMock) {
      return res.status(400).json({ error: 'An account with this email already exists (In-Memory)' })
    }

    const newMockUser = {
      _id: `mock-${Date.now()}`,
      id: `mock-${Date.now()}`,
      googleId: null,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      avatar: avatarUrl,
      role: ['deep@gmail.com', 'deepakk.23it@kongu.edu'].includes(normalizedEmail) ? 'admin' : 'user',
      quizStats: { xp: 0, completed: 0, streak: 0 },
      badges: [],
      createdAt: new Date(),
      lastLogin: new Date()
    }
    mockUsers.push(newMockUser)
    console.warn(`ℹ️ Database offline — registered user to temporary in-memory: ${normalizedEmail}`)
    return res.status(201).json({
      success: true,
      user: serializeUser(newMockUser),
      warning: 'Running in database-free fallback mode (session is temporary)'
    })
  }
})

// ── Login User ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const user = await User.findOne({ email: normalizedEmail })
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const isPasswordMatch = verifyPassword(password, user.password)
      if (!isPasswordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      // Auto-elevate custom user if they exist in DB with standard user role
      if (['deep@gmail.com', 'deepakk.23it@kongu.edu'].includes(normalizedEmail) && user.role !== 'admin') {
        user.role = 'admin'
      }

      user.lastLogin = new Date()
      await user.save()
      console.log(`👤 User logged in (MongoDB): ${user.email}`)
      return res.json({ success: true, user: serializeUser(user) })
    } catch (err) {
      console.error('❌ Database user login failed:', err.message)
      return res.status(500).json({ error: 'Database error occurred during login' })
    }
  } else {
    // MongoDB offline: check in-memory registry
    const mockUsers = req.app.locals.mockUsers || []
    const mockUser = mockUsers.find(u => u.email === normalizedEmail)
    if (!mockUser) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isPasswordMatch = verifyPassword(password, mockUser.password)
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    mockUser.lastLogin = new Date()
    console.warn(`ℹ️ Database offline — authenticated user from in-memory: ${normalizedEmail}`)
    return res.json({
      success: true,
      user: serializeUser(mockUser),
      warning: 'Running in database-free fallback mode (session is temporary)'
    })
  }
})

module.exports = router
