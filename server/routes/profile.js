const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const User = require('../models/User')
const Score = require('../models/Score')
const CarbonRequest = require('../models/CarbonRequest')
const { generateAvatar } = require('../utils/authHelper')

// ── GET /api/profile/:userId — Public profile data ──────────
router.get('/:userId', async (req, res) => {
  const { userId } = req.params
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const user = await User.findById(userId).select('-password')
      if (!user) return res.status(404).json({ error: 'User not found' })

      // Fetch user quiz scores
      const scores = await Score.find({ userId: userId.toString() })
        .sort({ createdAt: -1 })
        .limit(10)

      // Fetch carbon requests
      let carbonRequests = []
      try {
        carbonRequests = await CarbonRequest.find({ userId }).sort({ createdAt: -1 }).limit(10)
      } catch (e) {
        // CarbonRequest userId is ObjectId, try string match
        carbonRequests = []
      }

      return res.json({
        success: true,
        profile: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          quizStats: user.quizStats || { xp: 0, completed: 0, streak: 0 },
          badges: user.badges || [],
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
        scores,
        carbonRequests,
      })
    } catch (err) {
      console.error('❌ Profile fetch error:', err.message)
      return res.status(500).json({ error: 'Failed to fetch profile' })
    }
  } else {
    return res.json({
      success: true,
      profile: {
        _id: userId,
        name: 'Demo User',
        email: 'demo@climateai.io',
        avatar: generateAvatar('Demo User'),
        role: 'user',
        quizStats: { xp: 120, completed: 3, streak: 2 },
        badges: ['Climate Scholar', 'Eco-Guardian'],
        lastLogin: new Date(),
        createdAt: new Date(Date.now() - 86400000 * 30),
      },
      scores: [
        { userId, userName: 'Demo User', score: 100, xpGained: 100, createdAt: new Date() },
        { userId, userName: 'Demo User', score: 80, xpGained: 80, createdAt: new Date(Date.now() - 86400000) },
        { userId, userName: 'Demo User', score: 60, xpGained: 60, createdAt: new Date(Date.now() - 86400000 * 3) },
      ],
      carbonRequests: [],
      warning: 'DB offline — showing demo data',
    })
  }
})

// ── PATCH /api/profile/:userId — Update profile ─────────────
router.patch('/:userId', async (req, res) => {
  const { userId } = req.params
  const { name, avatar, bio } = req.body
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const updates = {}
      if (name) updates.name = name
      if (avatar) updates.avatar = avatar
      if (bio !== undefined) updates.bio = bio

      const updated = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password')
      if (!updated) return res.status(404).json({ error: 'User not found' })

      if (req.app?.locals?.io) {
        req.app.locals.io.emit('profile:updated', { userId, name: updated.name, avatar: updated.avatar })
        req.app.locals.activityLog?.push({ type: 'system', event: `Profile updated: ${updated.name}`, timestamp: Date.now() })
      }

      return res.json({ success: true, user: updated })
    } catch (err) {
      console.error('❌ Profile update error:', err.message)
      return res.status(500).json({ error: 'Failed to update profile' })
    }
  } else {
    return res.json({ success: true, user: { _id: userId, name, avatar, bio }, warning: 'DB offline' })
  }
})

// ── GET /api/profile — Admin: list all users ─────────────────
router.get('/', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 })
      return res.json({ success: true, users })
    } catch (err) {
      console.error('❌ Users list error:', err.message)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }
  } else {
    return res.json({
      success: true,
      users: [
        { _id: 'mock-1', name: 'Alex Carter', email: 'alex@gmail.com', role: 'user', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', quizStats: { xp: 200, completed: 5, streak: 3 }, badges: ['Climate Scholar'], createdAt: new Date() },
        { _id: 'mock-2', name: 'Elena Rostova', email: 'elena@gmail.com', role: 'admin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', quizStats: { xp: 500, completed: 10, streak: 7 }, badges: ['Eco-Guardian', 'Climate Scholar'], createdAt: new Date() },
        { _id: 'mock-3', name: 'Marcus Chen', email: 'marcus@gmail.com', role: 'user', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', quizStats: { xp: 80, completed: 2, streak: 1 }, badges: [], createdAt: new Date() },
      ],
      warning: 'DB offline',
    })
  }
})

// ── PATCH /api/profile/:userId/role — Admin: change role ─────
router.patch('/:userId/role', async (req, res) => {
  const { userId } = req.params
  const { role } = req.body
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' })

  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password')
      if (!updated) return res.status(404).json({ error: 'User not found' })
      if (req.app?.locals?.io) {
        req.app.locals.activityLog?.push({ type: 'system', event: `Role changed: ${updated.name} → ${role}`, timestamp: Date.now() })
      }
      return res.json({ success: true, user: updated })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update role' })
    }
  } else {
    return res.json({ success: true, user: { _id: userId, role }, warning: 'DB offline' })
  }
})

// ── DELETE /api/profile/:userId — Admin: delete user ─────────
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const del = await User.findByIdAndDelete(userId)
      if (!del) return res.status(404).json({ error: 'User not found' })
      if (req.app?.locals?.io) {
        req.app.locals.activityLog?.push({ type: 'system', event: `User deleted: ${del.name}`, timestamp: Date.now() })
      }
      return res.json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete user' })
    }
  } else {
    return res.json({ success: true, warning: 'DB offline' })
  }
})

module.exports = router
