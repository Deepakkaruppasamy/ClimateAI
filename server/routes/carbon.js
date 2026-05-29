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
const mockCarbonRequests = [];
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Request not found (invalid ID)' });
  }
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
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
    return res.status(503).json({ error: 'Database offline' });
  }
});

// Reject request
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Request not found (invalid ID)' });
  }
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
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
    return res.status(503).json({ error: 'Database offline' });
  }
});

module.exports = router;
