const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Comment = require('../models/Comment')
const Article = require('../models/Article')

// ── In-Memory Articles Fallback ──────────────────────────────
let mockArticles = [
  { 
    id: '1', _id: '1',
    title: 'Global Carbon Emissions Hit Plateaus in Tech Sectors', 
    category: 'Renewable Energy', 
    summary: 'New solar array and battery implementations in datacenters slow grid dependency growth rates globally.', 
    date: 'May 24, 2026', 
    likes: 142,
    imageUrl: ''
  },
  { 
    id: '2', _id: '2',
    title: 'Antarctic Temperature Telemetry Projects Warming Fluctuations', 
    category: 'Weather Extremes', 
    summary: 'Deep core temperature analysis shows complex oscillations in Southern currents, prompting sea levels concerns.', 
    date: 'May 20, 2026', 
    likes: 98,
    imageUrl: ''
  },
  { 
    id: '3', _id: '3',
    title: 'UN Climate Treaty Ratifies Strict Methane Caps', 
    category: 'Policy & Treaties', 
    summary: 'Thirty-two countries sign binding pacts setting harsh emissions penalties for agricultural and waste sectors.', 
    date: 'May 15, 2026', 
    likes: 215,
    imageUrl: ''
  }
]

// ── In-Memory Comments Fallback (Utilizes global app.locals.mockComments) ─────

// ── GET All Articles ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const articles = await Article.find().sort({ createdAt: -1 })
      const mapped = articles.length > 0 ? articles : mockArticles
      return res.json({ success: true, articles: mapped })
    } catch (err) {
      console.error('❌ Articles fetch error:', err.message)
      return res.json({ success: true, articles: mockArticles, warning: 'DB error — using fallback' })
    }
  } else {
    return res.json({ success: true, articles: mockArticles, warning: 'DB offline' })
  }
})

// ── POST Create Article (Admin) ──────────────────────────────
router.post('/', async (req, res) => {
  const { title, summary, category, date, imageUrl, featured } = req.body
  if (!title || !summary) {
    return res.status(400).json({ error: 'Title and summary are required' })
  }
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const article = new Article({ title, summary, category: category || 'General', date, imageUrl, featured })
      await article.save()
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:article-added', article)
        req.app.locals.activityLog?.push({ type: 'news', event: `Article published: "${title.slice(0, 50)}"`, timestamp: Date.now() })
      }
      return res.status(201).json({ success: true, article })
    } catch (err) {
      console.error('❌ Article create error:', err.message)
      return res.status(500).json({ error: 'Failed to create article' })
    }
  } else {
    const newArticle = {
      id: String(Date.now()),
      _id: String(Date.now()),
      title, summary,
      category: category || 'General',
      date: date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      imageUrl: imageUrl || '',
      likes: 0,
      featured: !!featured,
      createdAt: new Date()
    }
    mockArticles.unshift(newArticle)
    if (req.app?.locals?.io) {
      req.app.locals.io.emit('news:article-added', newArticle)
      req.app.locals.activityLog?.push({ type: 'news', event: `Article published: "${title.slice(0, 50)}"`, timestamp: Date.now() })
    }
    return res.status(201).json({ success: true, article: newArticle, warning: 'DB offline — stored in memory' })
  }
})

// ── PUT Update Article (Admin) ───────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title, summary, category, date, imageUrl, featured } = req.body
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const updated = await Article.findByIdAndUpdate(id, { title, summary, category, date, imageUrl, featured }, { new: true })
      if (!updated) return res.status(404).json({ error: 'Article not found' })
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:article-updated', updated)
      }
      return res.json({ success: true, article: updated })
    } catch (err) {
      console.error('❌ Article update error:', err.message)
      return res.status(500).json({ error: 'Failed to update article' })
    }
  } else {
    const idx = mockArticles.findIndex(a => a.id === id || a._id === id)
    if (idx === -1) return res.status(404).json({ error: 'Article not found' })
    mockArticles[idx] = { ...mockArticles[idx], title, summary, category, date, imageUrl, featured }
    if (req.app?.locals?.io) req.app.locals.io.emit('news:article-updated', mockArticles[idx])
    return res.json({ success: true, article: mockArticles[idx], warning: 'DB offline' })
  }
})

// ── DELETE Article (Admin) ───────────────────────────────────
router.delete('/:articleId/article', async (req, res) => {
  const { articleId } = req.params
  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const del = await Article.findByIdAndDelete(articleId)
      if (!del) return res.status(404).json({ error: 'Article not found' })
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:article-deleted', { id: articleId })
        req.app.locals.activityLog?.push({ type: 'news', event: `Article deleted: "${del.title?.slice(0, 50)}"`, timestamp: Date.now() })
      }
      return res.json({ success: true })
    } catch (err) {
      console.error('❌ Article delete error:', err.message)
      return res.status(500).json({ error: 'Failed to delete article' })
    }
  } else {
    const idx = mockArticles.findIndex(a => a.id === articleId || a._id === articleId)
    if (idx !== -1) {
      const deleted = mockArticles.splice(idx, 1)[0]
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:article-deleted', { id: articleId })
        req.app.locals.activityLog?.push({ type: 'news', event: `Article deleted: "${deleted.title?.slice(0, 50)}"`, timestamp: Date.now() })
      }
    }
    return res.json({ success: true, warning: 'DB offline' })
  }
})

// ── GET Comments for Article ────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  const articleId = req.params.id
  const isDBConnected = mongoose.connection.readyState === 1

  if (isDBConnected) {
    try {
      const dbComments = await Comment.find({ articleId }).sort({ pinned: -1, createdAt: -1 })
      return res.json({ success: true, comments: dbComments })
    } catch (err) {
      console.error('❌ Comments fetch error:', err.message)
      return res.status(500).json({ error: 'Failed to fetch comments' })
    }
  } else {
    const mockComments = req.app.locals.mockComments || []
    const filtered = mockComments
      .filter(c => c.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return res.json({ success: true, comments: filtered, warning: 'DB offline' })
  }
})

// ── POST Add Comment to Article ─────────────────────────────
router.post('/:id/comments', async (req, res) => {
  const articleId = req.params.id
  const { userName, userAvatar, content } = req.body

  if (!userName || !content) {
    return res.status(400).json({ error: 'Missing comment parameters' })
  }

  const isDBConnected = mongoose.connection.readyState === 1
  if (isDBConnected) {
    try {
      const newComment = new Comment({ articleId, userName, userAvatar, content })
      await newComment.save()
      console.log(`💬 Comment added for article ${articleId} by ${userName}`)
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:comment-added', { articleId, comment: newComment })
        req.app.locals.activityLog?.push({ type: 'news', event: `Comment by ${userName} on article #${articleId}`, timestamp: Date.now() })
      }
      return res.status(201).json({ success: true, comment: newComment })
    } catch (err) {
      console.error('❌ Comment saving error:', err.message)
      return res.status(500).json({ error: 'Failed to save comments' })
    }
  } else {
    const mockComments = req.app.locals.mockComments || []
    const newMockComment = {
      _id: `mock-c-${Date.now()}`,
      id: `mock-c-${Date.now()}`,
      articleId,
      userName,
      userAvatar,
      content,
      pinned: false,
      createdAt: new Date().toISOString()
    }
    mockComments.push(newMockComment)
    if (req.app?.locals?.io) {
      req.app.locals.io.emit('news:comment-added', { articleId, comment: newMockComment })
    }
    return res.status(201).json({
      success: true,
      comment: newMockComment,
      warning: 'Running in database-free fallback mode (comment is temporary)'
    })
  }
})

// ── DELETE Comment ──────────────────────────────────────────
router.delete('/:id/comments/:commentId', async (req, res) => {
  const { id: articleId, commentId } = req.params;
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const del = await Comment.findByIdAndDelete(commentId);
      if (!del) return res.status(404).json({ error: 'Comment not found' });
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:comment-updated', { articleId, commentId, action: 'delete' });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Delete comment error:', err.message);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  } else {
    const mockComments = req.app.locals.mockComments || []
    const index = mockComments.findIndex(c => c.articleId === articleId && (c._id === commentId || c.id === commentId));
    if (index !== -1) mockComments.splice(index, 1);
    if (req.app?.locals?.io) {
      req.app.locals.io.emit('news:comment-updated', { articleId, commentId, action: 'delete' });
    }
    return res.json({ success: true, warning: 'DB offline' });
  }
});

// ── Pin/Unpin Comment ───────────────────────────────────────
router.post('/:id/comments/:commentId/pin', async (req, res) => {
  const { id: articleId, commentId } = req.params;
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      comment.pinned = !comment.pinned;
      await comment.save();
      if (req.app?.locals?.io) {
        req.app.locals.io.emit('news:comment-updated', { articleId, commentId, action: 'pin', pinned: comment.pinned });
      }
      return res.json({ success: true, pinned: comment.pinned });
    } catch (err) {
      console.error('❌ Pin comment error:', err.message);
      return res.status(500).json({ error: 'Failed to toggle pin' });
    }
  } else {
    const mockComments = req.app.locals.mockComments || []
    const comment = mockComments.find(c => c.articleId === articleId && (c._id === commentId || c.id === commentId));
    if (!comment) return res.status(404).json({ error: 'Comment not found in memory' });
    comment.pinned = !comment.pinned;
    if (req.app?.locals?.io) {
      req.app.locals.io.emit('news:comment-updated', { articleId, commentId, action: 'pin', pinned: comment.pinned });
    }
    return res.json({ success: true, pinned: comment.pinned, warning: 'DB offline' });
  }
});

module.exports = router
