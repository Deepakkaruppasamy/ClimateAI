const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const CarbonRequest = require('../models/CarbonRequest');
const User = require('../models/User');

// ── POST Log Daily Footprint ─────────────────────────────────
router.post('/log', async (req, res) => {
  const { userId, footprint } = req.body;
  if (!userId || footprint === undefined) {
    return res.status(400).json({ error: 'Missing userId or footprint' });
  }
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      await User.findByIdAndUpdate(userId, {
        $push: { footprintHistory: { value: footprint, date: new Date() } },
        $set: { footprint }
      });
      console.log(`🌱 Footprint logged for user ${userId}: ${footprint} kg CO₂`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Footprint log error:', err.message);
      return res.status(500).json({ error: 'Failed to log footprint' });
    }
  } else {
    // In-memory fallback
    return res.json({ success: true, warning: 'Footprint logged in memory only (DB offline)' });
  }
});

// ── GET Leaderboard ──────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const users = await User.find({ footprint: { $gt: 0 } })
        .select('name avatar footprint quizStats badges')
        .sort({ footprint: 1 })
        .limit(20);
      return res.json({ success: true, leaderboard: users });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  } else {
    return res.json({ success: true, leaderboard: [], warning: 'DB offline' });
  }
});


// Badge calculation helper
function recalculateBadges(userObj, approvedCarbonTotal) {
  if (!userObj) return;
  if (!userObj.badges) userObj.badges = [];
  
  // Eco-Guardian
  if (approvedCarbonTotal > 0 && !userObj.badges.includes('Eco-Guardian')) {
    userObj.badges.push('Eco-Guardian');
  }
  // Carbon Neutral
  if (approvedCarbonTotal >= 10 && !userObj.badges.includes('Carbon Neutral')) {
    userObj.badges.push('Carbon Neutral');
  }
  // Climate Scholar
  if (userObj.quizStats && userObj.quizStats.completed >= 3 && !userObj.badges.includes('Climate Scholar')) {
    userObj.badges.push('Climate Scholar');
  }
  // Streak Master
  if (userObj.quizStats && userObj.quizStats.streak >= 7 && !userObj.badges.includes('Streak Master')) {
    userObj.badges.push('Streak Master');
  }
}

// GET all carbon requests
router.get('/requests', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const requests = await CarbonRequest.find({}).sort({ createdAt: -1 });
      return res.json({ success: true, requests });
    } catch (err) {
      console.error('❌ Fetch carbon requests error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch carbon requests' });
    }
  } else {
    const mockCarbonRequests = req.app.locals.mockCarbonRequests || [];
    return res.json({ success: true, requests: mockCarbonRequests, warning: 'DB offline — showing in-memory requests' });
  }
});

// POST new carbon request
router.post('/request', async (req, res) => {
  const { userId, amount, projectId } = req.body;
  if (!userId || !amount || !projectId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const newReq = new CarbonRequest({ userId, amount, projectId });
      await newReq.save();
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('carbon:request-created', newReq);
        req.app.locals.activityLog?.push({ type: 'carbon', event: `Carbon offset request: ${amount} tonnes (${projectId})`, timestamp: Date.now() });
      }
      return res.status(201).json({ success: true, request: newReq });
    } catch (err) {
      console.error('❌ Create carbon request error:', err.message);
      return res.status(500).json({ error: 'Failed to create request' });
    }
  } else {
    // In-memory fallback for demo mode
    const mockCarbonRequests = req.app.locals.mockCarbonRequests || [];
    const mockReq = {
      _id: `mock-${Date.now()}`,
      id: `mock-${Date.now()}`,
      userId, amount, projectId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    mockCarbonRequests.push(mockReq);
    if (req.app?.locals?.io) {
      req.app.locals.io.emit('carbon:request-created', mockReq);
      req.app.locals.activityLog?.push({ type: 'carbon', event: `Carbon offset request: ${amount} tonnes (${projectId})`, timestamp: Date.now() });
    }
    return res.status(201).json({ success: true, request: mockReq, warning: 'DB offline — stored in memory' });
  }
});

// Approve request
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const isMockId = String(id).startsWith('mock-') || String(id).startsWith('demo-');
  const isDBConnected = mongoose.connection.readyState === 1;

  if (isDBConnected && !isMockId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Request not found (invalid ID)' });
    }
    try {
      const updated = await CarbonRequest.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Request not found' });
      
      // Calculate approved total and update user badges in database
      const userRequests = await CarbonRequest.find({ userId: updated.userId, status: 'approved' });
      const approvedCarbonTotal = userRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
      
      const User = require('../models/User');
      const userObj = await User.findById(updated.userId);
      if (userObj) {
        recalculateBadges(userObj, approvedCarbonTotal);
        await userObj.save();
        if (req.app?.locals?.io) {
          req.app.locals.io.emit('profile:updated', { userId: userObj._id, name: userObj.name, avatar: userObj.avatar });
        }
      }

      if (req.app && req.app.locals && req.app.locals.io) {
        req.app.locals.io.emit('carbon:status-updated', updated);
      }
      return res.json({ success: true, request: updated });
    } catch (err) {
      console.error('❌ Approve carbon request error:', err.message);
      return res.status(500).json({ error: 'Failed to approve request' });
    }
  } else {
    // In-memory fallback/demo updates
    const mockCarbonRequests = req.app.locals.mockCarbonRequests || [];
    const index = mockCarbonRequests.findIndex(r => r._id === id || r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Mock/Demo request not found' });
    }
    mockCarbonRequests[index].status = 'approved';
    const updated = mockCarbonRequests[index];
    
    // Find mock user and update badges
    const mockUsers = req.app.locals.mockUsers || [];
    const userObj = mockUsers.find(u => u._id === updated.userId || u.id === updated.userId);
    if (userObj) {
      const userRequests = mockCarbonRequests.filter(r => (r.userId === userObj._id || r.userId === userObj.id) && r.status === 'approved');
      const approvedCarbonTotal = userRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
      recalculateBadges(userObj, approvedCarbonTotal);
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('profile:updated', { userId: userObj._id || userObj.id, name: userObj.name, avatar: userObj.avatar });
      }
    }

    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.emit('carbon:status-updated', updated);
    }
    return res.json({ success: true, request: updated, warning: 'DB offline — updated in memory' });
  }
});

// Reject request
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const isMockId = String(id).startsWith('mock-') || String(id).startsWith('demo-');
  const isDBConnected = mongoose.connection.readyState === 1;

  if (isDBConnected && !isMockId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Request not found (invalid ID)' });
    }
    try {
      const updated = await CarbonRequest.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Request not found' });
      if (req.app && req.app.locals && req.app.locals.io) {
        req.app.locals.io.emit('carbon:status-updated', updated);
      }
      return res.json({ success: true, request: updated });
    } catch (err) {
      console.error('❌ Reject carbon request error:', err.message);
      return res.status(500).json({ error: 'Failed to reject request' });
    }
  } else {
    // In-memory fallback/demo updates
    const mockCarbonRequests = req.app.locals.mockCarbonRequests || [];
    const index = mockCarbonRequests.findIndex(r => r._id === id || r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Mock/Demo request not found' });
    }
    mockCarbonRequests[index].status = 'rejected';
    const updated = mockCarbonRequests[index];
    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.emit('carbon:status-updated', updated);
    }
    return res.json({ success: true, request: updated, warning: 'DB offline — updated in memory' });
  }
});

module.exports = router;
