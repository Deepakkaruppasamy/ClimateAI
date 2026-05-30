const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const QuizQuestion = require('../models/QuizQuestion');

// GET all quiz questions (with optional category/difficulty filter)
router.get('/questions', async (req, res) => {
  try {
    const { category, difficulty } = req.query
    const filter = {}
    if (category && category !== 'all') filter.category = category
    if (difficulty) filter.difficulty = difficulty
    const questions = await QuizQuestion.find(filter)
    return res.json({ success: true, questions })
  } catch (err) {
    console.error('❌ Quiz fetch error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch quiz questions' })
  }
});

// GET /daily — 5 questions seeded by today's date (deterministic)
router.get('/daily', async (req, res) => {
  try {
    const allQuestions = await QuizQuestion.find()
    if (!allQuestions.length) return res.json({ success: true, questions: [] })
    // Deterministic seed based on date
    const today = new Date().toISOString().split('T')[0]
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0)
    const shuffled = [...allQuestions].sort((a, b) => {
      const hashA = (parseInt(a._id.toString().slice(-4), 16) + seed) % 1000
      const hashB = (parseInt(b._id.toString().slice(-4), 16) + seed) % 1000
      return hashA - hashB
    })
    return res.json({ success: true, questions: shuffled.slice(0, 5), date: today })
  } catch (err) {
    // Fallback mock daily questions
    const mockDailyQuestions = [
      { _id: 'd1', question: 'What is the main greenhouse gas emitted by human activity?', options: ['CO₂', 'N₂', 'O₂', 'H₂'], answer: 'CO₂', expl: 'Carbon dioxide from fossil fuels is the primary driver of climate change.', category: 'climate-science', difficulty: 'easy' },
      { _id: 'd2', question: 'The Paris Agreement aims to limit warming to what temperature above pre-industrial levels?', options: ['1.5°C', '2°C', '3°C', '0.5°C'], answer: '1.5°C', expl: 'The Paris Agreement targets 1.5°C to prevent the worst climate impacts.', category: 'policy', difficulty: 'medium' },
      { _id: 'd3', question: 'Which renewable energy source is currently the fastest growing globally?', options: ['Solar', 'Wind', 'Hydro', 'Geothermal'], answer: 'Solar', expl: 'Solar PV capacity has grown exponentially due to falling costs.', category: 'renewable-energy', difficulty: 'easy' },
      { _id: 'd4', question: 'Approximately what percentage of global emissions come from the food system?', options: ['10%', '25%', '35%', '50%'], answer: '25%', expl: 'The food system including agriculture and land use contributes ~25% of global GHG.', category: 'climate-science', difficulty: 'hard' },
      { _id: 'd5', question: 'Which biome stores the most carbon per unit area?', options: ['Mangroves', 'Tropical rainforest', 'Tundra', 'Grasslands'], answer: 'Mangroves', expl: 'Mangroves store up to 4x more carbon than tropical rainforests per unit area.', category: 'ecosystems', difficulty: 'hard' },
    ]
    return res.json({ success: true, questions: mockDailyQuestions, date: new Date().toISOString().split('T')[0] })
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

// Badge calculation helper
function recalculateBadges(userObj, score) {
  if (!userObj) return;
  if (!userObj.badges) userObj.badges = [];
  
  // Climate Scholar
  if (userObj.quizStats && userObj.quizStats.completed >= 3 && !userObj.badges.includes('Climate Scholar')) {
    userObj.badges.push('Climate Scholar');
  }
  // Quiz Champion
  if (score === 100 && !userObj.badges.includes('Quiz Champion')) {
    userObj.badges.push('Quiz Champion');
  }
  // Streak Master
  if (userObj.quizStats && userObj.quizStats.streak >= 7 && !userObj.badges.includes('Streak Master')) {
    userObj.badges.push('Streak Master');
  }
}

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
    const mockScores = req.app.locals.mockScores || [];
    const standings = [...mockScores].sort((a, b) => b.score - a.score).slice(0, 10);
    return res.json({ success: true, leaderboard: standings, warning: 'DB offline' });
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
      let query = {};
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query = { _id: userId };
      } else {
        query = { $or: [{ googleId: userId }, { email: userId }] };
      }
      const userObj = await User.findOne(query);
      if (userObj) {
        if (!userObj.quizStats) {
          userObj.quizStats = { streak: 0, xp: 0, completed: 0 };
        }
        userObj.quizStats.xp += xpGained;
        userObj.quizStats.completed += 1;
        userObj.quizStats.streak += 1;
        
        recalculateBadges(userObj, score);
        await userObj.save();
        
        if (req.app?.locals?.io) {
          req.app.locals.io.emit('profile:updated', { userId: userObj._id, name: userObj.name, avatar: userObj.avatar });
        }
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
    // Save to shared mockScores
    const mockScores = req.app.locals.mockScores || [];
    const newScore = {
      userId,
      userName,
      score,
      xpGained,
      createdAt: new Date()
    };
    mockScores.push(newScore);

    // Update mock user statistics
    const mockUsers = req.app.locals.mockUsers || [];
    const userObj = mockUsers.find(u => u._id === userId || u.id === userId || u.email === userId || u.googleId === userId);
    if (userObj) {
      if (!userObj.quizStats) {
        userObj.quizStats = { streak: 0, xp: 0, completed: 0 };
      }
      userObj.quizStats.xp += xpGained;
      userObj.quizStats.completed += 1;
      userObj.quizStats.streak += 1;
      
      recalculateBadges(userObj, score);
      
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('profile:updated', { userId: userObj._id || userObj.id, name: userObj.name, avatar: userObj.avatar });
      }
    }

    // Emit real-time score notification
    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.emit('quiz:score-submitted', newScore);
    }

    return res.status(201).json({
      success: true,
      score: newScore,
      warning: 'DB offline — saved in memory'
    });
  }
});

module.exports = router;
