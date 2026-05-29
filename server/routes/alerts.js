const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Rule = require('../models/Rule')

// ── Mock Alerts Data ────────────────────────────────────────
const activeAlerts = [
  { id: 1, type: 'uv_advisory', severity: 'moderate', title: 'UV Advisory', message: 'UV Index 6-7 expected. Use sunscreen.', area: 'All Regions', expires: '2026-05-27T20:00:00Z' },
  { id: 2, type: 'wind_advisory', severity: 'low', title: 'Wind Advisory', message: 'Gusts up to 50 km/h coastal regions.', area: 'Coastal', expires: '2026-05-27T18:00:00Z' },
]

// ── In-Memory Rules Fallback ────────────────────────────────
const mockRules = [
  { id: 'mock_rule_1', userId: 'mock', city: 'Paris', metric: 'temp', condition: 'greater', value: 40, active: true },
  { id: 'mock_rule_2', userId: 'mock', city: 'New York', metric: 'aqi', condition: 'greater', value: 150, active: true }
]

// ── GET Active Alerts Feed ──────────────────────────────────
router.get('/', (req, res) => res.json({ alerts: activeAlerts, count: activeAlerts.length }))
router.get('/active', (req, res) => res.json({ alerts: activeAlerts.filter(a => a.severity !== 'expired') }))

// ── GET User Custom Rules ───────────────────────────────────
router.get('/rules', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const rules = await Rule.find()
      return res.json({ success: true, rules })
    } catch (err) {
      console.error('❌ Rules fetch error:', err.message)
      return res.status(500).json({ error: 'Failed to fetch rules' })
    }
  } else {
    // Database offline: Return memory list
    return res.json({ success: true, rules: mockRules, warning: 'DB offline' })
  }
})

// ── POST Create Custom Rule ──────────────────────────────────
router.post('/rules', async (req, res) => {
  const { userId, city, metric, condition, value } = req.body

  if (!userId || !city || !metric || !condition || value === undefined) {
    return res.status(400).json({ error: 'Missing alert rule parameters' })
  }

  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const newRule = new Rule({
        userId,
        city,
        metric,
        condition,
        value,
        active: true
      })
      await newRule.save()
      console.log(`🔔 Alert rule registered: User ${userId} for ${city} ${metric} ${condition} ${value}`)
      return res.status(201).json({ success: true, rule: newRule })
    } catch (err) {
      console.error('❌ Rule saving error:', err.message)
      return res.status(500).json({ error: 'Failed to save rule' })
    }
  } else {
    // Database offline: Push to memory
    const newMockRule = {
      id: `mock_rule_${Date.now()}`,
      userId,
      city,
      metric,
      condition,
      value,
      active: true
    }
    mockRules.push(newMockRule)
    console.warn(`ℹ️ Database offline — rule saved in temporary memory: ${city}`)
    return res.status(201).json({
      success: true,
      rule: newMockRule,
      warning: 'Running in database-free fallback mode (rule is temporary)'
    })
  }
})

// ── DELETE Custom Rule ──────────────────────────────────────
router.delete('/rules/:id', async (req, res) => {
  const ruleId = req.params.id
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      await Rule.findByIdAndDelete(ruleId)
      console.log(`🔔 Alert rule deleted: ${ruleId}`)
      return res.json({ success: true, message: 'Rule successfully deleted' })
    } catch (err) {
      console.error('❌ Rule deletion error:', err.message)
      return res.status(500).json({ error: 'Failed to delete rule' })
    }
  } else {
    // Database offline: Delete from memory
    const index = mockRules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      mockRules.splice(index, 1)
      return res.json({ success: true, message: 'Rule successfully deleted (In-Memory)' })
    }
    return res.status(404).json({ error: 'Rule not found' })
  }
})

// ── GET Specific Alert ──────────────────────────────────────
router.get('/:id', (req, res) => {
  const alert = activeAlerts.find(a => a.id === parseInt(req.params.id))
  if (!alert) return res.status(404).json({ error: 'Alert not found' })
  res.json(alert)
})

module.exports = router
