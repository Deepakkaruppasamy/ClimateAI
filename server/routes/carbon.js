const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const CarbonRequest = require('../models/CarbonRequest');

// GET pending carbon requests
router.get('/requests', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const pending = await CarbonRequest.find({ status: 'pending' });
      return res.json({ success: true, requests: pending });
    } catch (err) {
      console.error('❌ Fetch carbon requests error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch carbon requests' });
    }
  } else {
    return res.json({ success: true, requests: mockCarbonRequests, warning: 'DB offline — showing in-memory requests' });
  }
});

// POST new carbon request
const mockCarbonRequests = [
  { _id: 'demo-1', id: 'demo-1', userId: 'user_alpha', projectId: 'PROJ-2024-GHG', amount: 150, status: 'pending',  createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { _id: 'demo-2', id: 'demo-2', userId: 'user_beta',  projectId: 'PROJ-2023-WIND', amount: 220, status: 'approved', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  { _id: 'demo-3', id: 'demo-3', userId: 'user_gamma', projectId: 'PROJ-2024-SOLAR', amount: 80, status: 'rejected', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { _id: 'demo-4', id: 'demo-4', userId: 'user_delta', projectId: 'PROJ-2025-BIOFUEL', amount: 310, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
];

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
    const index = mockCarbonRequests.findIndex(r => r._id === id || r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Mock/Demo request not found' });
    }
    mockCarbonRequests[index].status = 'approved';
    const updated = mockCarbonRequests[index];
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
