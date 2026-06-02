const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Comment = require('../models/Comment')
const Article = require('../models/Article')

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

let liveNewsCache = null
let liveCacheTimestamp = 0
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 

router.get('/live', async (req, res) => {
  const GNEWS_KEY = process.env.GNEWS_API_KEY
  const now = Date.now()

  if (liveNewsCache && (now - liveCacheTimestamp) < CACHE_TTL_MS) {
    return res.json({ success: true, articles: liveNewsCache, cached: true })
  }

  if (!GNEWS_KEY) {
    const fallbackLive = [
      { id: 'l1', title: 'Record Solar Power Output Achieved in Europe This Quarter', category: 'Renewable Energy', summary: 'European solar grids hit a new milestone as sunshine hours and panel efficiency combine for record output, reducing fossil fuel dependency by 18%.', date: new Date().toLocaleDateString(), likes: 0, source: 'live', imageUrl: '' },
      { id: 'l2', title: 'Ocean Heat Content Reaches Highest Level in Recorded History', category: 'Climate Science', summary: 'New oceanographic data confirms the world\'s oceans absorbed unprecedented amounts of heat last year, accelerating glacier melt timelines.', date: new Date().toLocaleDateString(), likes: 0, source: 'live', imageUrl: '' },
      { id: 'l3', title: 'Carbon Capture Plants Expand Across Industrial Zones in Asia', category: 'Carbon Tech', summary: 'A coalition of Asian manufacturing hubs announces large-scale deployment of direct air capture technology to meet net-zero commitments.', date: new Date().toLocaleDateString(), likes: 0, source: 'live', imageUrl: '' },
      { id: 'l4', title: 'New IPCC Report Urges Immediate Policy Overhaul on Methane', category: 'Policy & Treaties', summary: 'The latest IPCC working group report identifies methane reduction as the fastest lever for limiting near-term temperature rise.', date: new Date().toLocaleDateString(), likes: 0, source: 'live', imageUrl: '' },
      { id: 'l5', title: 'Biodiversity Crisis Linked to Climate Change in Landmark Study', category: 'Ecosystems', summary: 'A 10-year global study confirms that 1 in 6 species faces extinction risk directly attributable to rising temperatures and habitat loss.', date: new Date().toLocaleDateString(), likes: 0, source: 'live', imageUrl: '' },
    ]
    return res.json({ success: true, articles: fallbackLive, demo: true, message: 'Set GNEWS_API_KEY in .env for real live news' })
  }

  try {
    const https = require('https')
    const url = `https://gnews.io/api/v4/search?q=climate+change&lang=en&max=10&sortby=publishedAt&apikey=${GNEWS_KEY}`
    
    const fetchData = () => new Promise((resolve, reject) => {
      https.get(url, (response) => {
        let data = ''
        response.on('data', chunk => data += chunk)
        response.on('end', () => resolve(JSON.parse(data)))
        response.on('error', reject)
      }).on('error', reject)
    })

    const gdata = await fetchData()
    if (gdata.articles) {
      liveNewsCache = gdata.articles.map((a, i) => ({
        id: `gnews-${i}`,
        title: a.title,
        category: 'Climate News',
        summary: a.description || a.content?.slice(0, 200) || '',
        date: new Date(a.publishedAt).toLocaleDateString(),
        likes: 0,
        source: 'live',
        url: a.url,
        imageUrl: a.image || ''
      }))
      liveCacheTimestamp = now
      return res.json({ success: true, articles: liveNewsCache })
    } else {
      return res.json({ success: true, articles: [], error: 'GNews returned no articles' })
    }
  } catch (err) {
    console.error('❌ GNews fetch error:', err.message)
    return res.json({ success: true, articles: [], error: 'Failed to fetch live news' })
  }
})

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
