const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const QuizQuestion = require('../models/QuizQuestion');

// GET all quiz questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await QuizQuestion.find();
    return res.json({ success: true, questions });
  } catch (err) {
    console.error('❌ Quiz fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// POST create quiz question
router.post('/questions', async (req, res) => {
  const { question, options, answer, expl } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const newQ = new QuizQuestion({ question, options, answer, expl: expl || '', type: 'multiple-choice' });
    await newQ.save();
    // emit socket event for admin dashboards
    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.emit('quiz:question-added', newQ);
      req.app.locals.activityLog && req.app.locals.activityLog.push({ type: 'quiz', event: `New question added: "${question.slice(0, 60)}"`, timestamp: Date.now() });
    }
    return res.status(201).json({ success: true, question: newQ });
  } catch (err) {
    console.error('❌ Quiz create error:', err.message);
    return res.status(500).json({ error: 'Failed to create quiz question' });
  }
});

// PUT update quiz question
router.put('/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { question, options, answer, expl } = req.body;
  try {
    const updated = await QuizQuestion.findByIdAndUpdate(id, { question, options, answer, expl: expl || '' }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Question not found' });
    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.emit('quiz:question-updated', updated);
    }
    return res.json({ success: true, question: updated });
  } catch (err) {
    console.error('❌ Quiz update error:', err.message);
    return res.status(500).json({ error: 'Failed to update quiz question' });
  }
});

// DELETE quiz question
router.delete('/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const del = await QuizQuestion.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ error: 'Question not found' });
    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.emit('quiz:question-deleted', { id });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Quiz delete error:', err.message);
    return res.status(500).json({ error: 'Failed to delete quiz question' });
  }
});

const Score = require('../models/Score');

// POST trigger daily challenge (emit socket)
router.post('/challenge', (req, res) => {
  if (req.app && req.app.locals && req.app.locals.io) {
    req.app.locals.io.emit('quiz:challenge-mode', { timestamp: Date.now() });
  }
  return res.json({ success: true, message: 'Challenge dispatched' });
});

// GET high scores leaderboard
router.get('/leaderboard', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const standings = await Score.find().sort({ score: -1, createdAt: -1 }).limit(10);
      return res.json({ success: true, leaderboard: standings });
    } catch (err) {
      console.error('❌ Leaderboard fetch error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  } else {
    // In-memory fallback
    const mockLeaderboard = [
      { userId: 'mock-1', userName: 'EcoChampion', score: 100, xpGained: 100, createdAt: new Date() },
      { userId: 'mock-2', userName: 'SolarSleuth', score: 80, xpGained: 80, createdAt: new Date() },
      { userId: 'mock-3', userName: 'WindWalker', score: 60, xpGained: 60, createdAt: new Date() },
    ];
    return res.json({ success: true, leaderboard: mockLeaderboard, warning: 'DB offline' });
  }
});

// POST submit quiz score
router.post('/score', async (req, res) => {
  const { userId, userName, score, xpGained } = req.body;
  if (!userId || !userName || score === undefined || xpGained === undefined) {
    return res.status(400).json({ error: 'Missing required score parameters' });
  }
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const newScore = new Score({ userId, userName, score, xpGained });
      await newScore.save();

      // Update user statistics if database has user
      const User = require('../models/User');
      const userObj = await User.findOne({
        $or: [{ googleId: userId }, { email: userId }]
      });
      if (userObj) {
        if (!userObj.quizStats) {
          userObj.quizStats = { streak: 0, xp: 0, completed: 0 };
        }
        userObj.quizStats.xp += xpGained;
        userObj.quizStats.completed += 1;
        userObj.quizStats.streak += 1;
        await userObj.save();
      }

      // Emit real-time score notification
      if (req.app && req.app.locals && req.app.locals.io) {
        req.app.locals.io.emit('quiz:score-submitted', newScore);
      }

      return res.status(201).json({ success: true, score: newScore });
    } catch (err) {
      console.error('❌ Score save error:', err.message);
      return res.status(500).json({ error: 'Failed to save score' });
    }
  } else {
    return res.status(201).json({
      success: true,
      score: { userId, userName, score, xpGained },
      warning: 'DB offline'
    });
  }
});

module.exports = router;
