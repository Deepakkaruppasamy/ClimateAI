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
          footprint: user.footprint || 0,
          bio: user.bio || '',
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
    // In-memory fallback
    const mockUsers = req.app.locals.mockUsers || []
    const mockScores = req.app.locals.mockScores || []
    const mockCarbonRequests = req.app.locals.mockCarbonRequests || []

    let user = mockUsers.find(u => u._id === userId || u.id === userId || u.email === userId)
    if (!user) {
      user = {
        _id: userId,
        id: userId,
        googleId: null,
        name: 'Demo User',
        email: 'demo@climateai.io',
        avatar: generateAvatar('Demo User'),
        role: 'user',
        quizStats: { xp: 120, completed: 3, streak: 2 },
        badges: ['Climate Scholar', 'Eco-Guardian'],
        createdAt: new Date(Date.now() - 86400000 * 30),
        lastLogin: new Date(),
        bio: 'Climate Enthusiast'
      }
      mockUsers.push(user)
    }

    const scores = mockScores.filter(s => s.userId === userId || s.userId === user._id || s.userId === user.id)
    const carbonRequests = mockCarbonRequests.filter(r => r.userId === userId || r.userId === user._id || r.userId === user.id)

    return res.json({
      success: true,
      profile: {
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        quizStats: user.quizStats || { xp: 0, completed: 0, streak: 0 },
        badges: user.badges || [],
        footprint: user.footprint || 0,
        bio: user.bio || '',
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      scores,
      carbonRequests,
      warning: 'DB offline — showing persistent mock data',
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
    // In-memory fallback
    const mockUsers = req.app.locals.mockUsers || []
    const index = mockUsers.findIndex(u => u._id === userId || u.id === userId)
    if (index !== -1) {
      if (name) mockUsers[index].name = name
      if (avatar) mockUsers[index].avatar = avatar
      if (bio !== undefined) mockUsers[index].bio = bio

      const updated = mockUsers[index]
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('profile:updated', { userId, name: updated.name, avatar: updated.avatar })
        req.app.locals.activityLog?.push({ type: 'system', event: `Profile updated (mock): ${updated.name}`, timestamp: Date.now() })
      }
      return res.json({ success: true, user: updated, warning: 'DB offline — updated in memory' })
    }
    return res.json({ success: true, user: { _id: userId, name, avatar, bio }, warning: 'DB offline' })
  }
})

// ── POST /api/profile/:userId/footprint — Update footprint + save to history ──
router.post('/:userId/footprint', async (req, res) => {
  const { userId } = req.params
  const { footprint } = req.body
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          footprint,
          $push: {
            footprintHistory: {
              $each: [{ value: footprint, date: new Date() }],
              $slice: -24 // Keep last 24 entries (2 years monthly)
            }
          }
        },
        { new: true }
      ).select('-password')
      if (!updated) return res.status(404).json({ error: 'User not found' })
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('profile:updated', { userId, footprint: updated.footprint })
      }
      return res.json({ success: true, user: updated })
    } catch (err) {
      console.error('❌ Footprint update error:', err.message)
      return res.status(500).json({ error: 'Failed to update footprint' })
    }
  } else {
    // In-memory fallback
    const mockUsers = req.app.locals.mockUsers || []
    const index = mockUsers.findIndex(u => u._id === userId || u.id === userId)
    if (index !== -1) {
      mockUsers[index].footprint = footprint
      if (!mockUsers[index].footprintHistory) mockUsers[index].footprintHistory = []
      mockUsers[index].footprintHistory.push({ value: footprint, date: new Date() })
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('profile:updated', { userId, footprint })
      }
      return res.json({ success: true, user: mockUsers[index], warning: 'DB offline — updated in memory' })
    }
    return res.json({ success: true, warning: 'DB offline' })
  }
})

// ── GET /api/profile/:userId/footprint-history ────────────────
router.get('/:userId/footprint-history', async (req, res) => {
  const { userId } = req.params
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const user = await User.findById(userId).select('footprintHistory footprint')
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.json({ success: true, history: user.footprintHistory || [], current: user.footprint || 0 })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch history' })
    }
  } else {
    const mockUsers = req.app.locals.mockUsers || []
    const user = mockUsers.find(u => u._id === userId || u.id === userId)
    if (!user) return res.json({ success: true, history: [], current: 0 })
    // Generate mock history for demo
    const mockHistory = Array.from({ length: 6 }, (_, i) => ({
      value: parseFloat((Math.random() * 6 + 4).toFixed(1)),
      date: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000)
    }))
    return res.json({ success: true, history: user.footprintHistory?.length ? user.footprintHistory : mockHistory, current: user.footprint || 0, warning: 'DB offline' })
  }
})

// ── POST /api/profile/:userId/badge — Award a badge ──────────
router.post('/:userId/badge', async (req, res) => {
  const { userId } = req.params
  const { badge } = req.body
  const validBadges = ['Climate Scholar', 'Eco-Guardian', 'Carbon Neutral', 'Quiz Champion', 'Streak Master', 'Climate Defender', 'Admin']
  if (!badge || !validBadges.includes(badge)) return res.status(400).json({ error: 'Invalid badge' })

  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const user = await User.findById(userId)
      if (!user) return res.status(404).json({ error: 'User not found' })
      if (!user.badges.includes(badge)) {
        user.badges.push(badge)
        await user.save()
        if (req.app?.locals?.io) {
          req.app.locals.io.emit('profile:updated', { userId, badges: user.badges })
        }
      }
      return res.json({ success: true, badges: user.badges })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to award badge' })
    }
  } else {
    const mockUsers = req.app.locals.mockUsers || []
    const user = mockUsers.find(u => u._id === userId || u.id === userId)
    if (user) {
      if (!user.badges) user.badges = []
      if (!user.badges.includes(badge)) user.badges.push(badge)
      return res.json({ success: true, badges: user.badges, warning: 'DB offline' })
    }
    return res.json({ success: true, badges: [badge], warning: 'DB offline' })
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
    const mockUsers = req.app.locals.mockUsers || []
    return res.json({
      success: true,
      users: mockUsers.map(u => ({ ...u, password: undefined })),
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
    const mockUsers = req.app.locals.mockUsers || []
    const index = mockUsers.findIndex(u => u._id === userId || u.id === userId)
    if (index !== -1) {
      mockUsers[index].role = role
      if (req.app?.locals?.io) {
        req.app.locals.activityLog?.push({ type: 'system', event: `Role changed: ${mockUsers[index].name} → ${role}`, timestamp: Date.now() })
      }
      return res.json({ success: true, user: mockUsers[index], warning: 'DB offline' })
    }
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
    const mockUsers = req.app.locals.mockUsers || []
    const index = mockUsers.findIndex(u => u._id === userId || u.id === userId)
    if (index !== -1) {
      const delName = mockUsers[index].name
      mockUsers.splice(index, 1)
      if (req.app?.locals?.io) {
        req.app.locals.activityLog?.push({ type: 'system', event: `User deleted: ${delName}`, timestamp: Date.now() })
      }
    }
    return res.json({ success: true, warning: 'DB offline' })
  }
})

module.exports = router
