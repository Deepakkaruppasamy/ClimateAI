import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, MessageSquare, Trash2, Pin, PinOff, RefreshCw, ChevronDown, Loader2, AlertCircle, Plus, X, Edit2, Save } from 'lucide-react'

function CommentRow({ comment, onDelete, onTogglePin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group"
    >
      {comment.userAvatar && (
        <img src={comment.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 opacity-80" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white">{comment.userName || 'Anonymous'}</span>
          {comment.pinned && (
            <span className="text-[10px] font-mono text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.5 rounded-full border border-neon-cyan/20">PINNED</span>
          )}
          <span className="text-[10px] text-gray-600 ml-auto">
            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{comment.content}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onTogglePin(comment._id || comment.id)}
          title={comment.pinned ? 'Unpin' : 'Pin'}
          className="p-1.5 rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan transition-colors"
        >
          {comment.pinned ? <PinOff size={12} /> : <Pin size={12} />}
        </button>
        <button
          onClick={() => onDelete(comment._id || comment.id)}
          title="Delete"
          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  )
}

export default function NewsModeration({ socket }) {
  const [articles, setArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  // New article form
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formCategory, setFormCategory] = useState('Renewable Energy')
  const [submittingArticle, setSubmittingArticle] = useState(false)
  const [formError, setFormError] = useState('')

  const categoryColors = {
    'Renewable Energy': '#06ffd4',
    'Weather Extremes': '#ff8800',
    'Policy & Treaties': '#7c3aed',
    'Technology': '#00d4ff',
    'General': '#aaaaaa',
  }

  // Fetch articles dynamically
  const fetchArticles = async (silent = false) => {
    if (!silent) setLoadingArticles(true)
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (res.ok && data.articles) setArticles(data.articles)
    } catch (e) {
      console.error('Failed to fetch articles:', e)
    } finally {
      setLoadingArticles(false)
    }
  }

  useEffect(() => { fetchArticles() }, [])

  // Socket listeners for real-time article updates
  useEffect(() => {
    if (!socket) return
    const onAdded = (article) => setArticles(prev => [article, ...prev])
    const onUpdated = (article) => setArticles(prev => prev.map(a => (a._id || a.id) === (article._id || article.id) ? article : a))
    const onDeleted = ({ id }) => setArticles(prev => prev.filter(a => (a._id || a.id) !== id))
    const onCommentUpdated = ({ articleId, commentId, action, pinned }) => {
      if (action === 'delete') {
        setComments(prev => ({ ...prev, [articleId]: (prev[articleId] || []).filter(c => (c._id || c.id) !== commentId) }))
      } else if (action === 'pin') {
        setComments(prev => ({ ...prev, [articleId]: (prev[articleId] || []).map(c => (c._id || c.id) === commentId ? { ...c, pinned } : c) }))
      }
    }
    socket.on('news:article-added', onAdded)
    socket.on('news:article-updated', onUpdated)
    socket.on('news:article-deleted', onDeleted)
    socket.on('news:comment-updated', onCommentUpdated)
    return () => {
      socket.off('news:article-added', onAdded)
      socket.off('news:article-updated', onUpdated)
      socket.off('news:article-deleted', onDeleted)
      socket.off('news:comment-updated', onCommentUpdated)
    }
  }, [socket])

  const loadComments = async (articleId, silent = false) => {
    if (!silent) setLoading(prev => ({ ...prev, [articleId]: true }))
    setErrors(prev => ({ ...prev, [articleId]: '' }))
    try {
      const res = await fetch(`/api/news/${articleId}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(prev => ({ ...prev, [articleId]: data.comments || [] }))
      } else {
        setErrors(prev => ({ ...prev, [articleId]: data.error || 'Failed to load comments' }))
      }
    } catch {
      setErrors(prev => ({ ...prev, [articleId]: 'Network error' }))
    } finally {
      setLoading(prev => ({ ...prev, [articleId]: false }))
    }
  }

  const handleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!comments[id]) loadComments(id)
  }

  const handleDelete = async (articleId, commentId) => {
    try {
      const res = await fetch(`/api/news/${articleId}/comments/${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        setComments(prev => ({ ...prev, [articleId]: prev[articleId].filter(c => (c._id || c.id) !== commentId) }))
      }
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const handleTogglePin = async (articleId, commentId) => {
    try {
      const res = await fetch(`/api/news/${articleId}/comments/${commentId}/pin`, { method: 'POST' })
      if (res.ok) {
        setComments(prev => ({ ...prev, [articleId]: prev[articleId].map(c => (c._id || c.id) === commentId ? { ...c, pinned: !c.pinned } : c) }))
      }
    } catch (e) {
      console.error('Pin failed:', e)
    }
  }

  const handleDeleteArticle = async (articleId, e) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/news/${articleId}/article`, { method: 'DELETE' })
      if (res.ok) {
        setArticles(prev => prev.filter(a => (a._id || a.id) !== articleId))
        if (expanded === articleId) setExpanded(null)
      }
    } catch (e) {
      console.error('Article delete failed:', e)
    }
  }

  const handleCreateArticle = async (e) => {
    e.preventDefault()
    if (!formTitle.trim() || !formSummary.trim()) return
    setSubmittingArticle(true)
    setFormError('')
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, summary: formSummary, category: formCategory })
      })
      const data = await res.json()
      if (res.ok && data.article) {
        setArticles(prev => [data.article, ...prev])
        setFormTitle('')
        setFormSummary('')
        setShowForm(false)
      } else {
        setFormError(data.error || 'Failed to create article')
      }
    } catch {
      setFormError('Network error')
    } finally {
      setSubmittingArticle(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchArticles(true)
    for (const article of articles) {
      if (comments[article._id || article.id]) await loadComments(article._id || article.id, true)
    }
    setRefreshing(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white font-display">News Moderation</h3>
          <span className="text-xs text-gray-500 font-mono">({articles.length} articles)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neon-cyan glass px-3 py-1.5 rounded-xl transition-colors"
          >
            <motion.span animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, ease: 'linear' }}>
              <RefreshCw size={12} />
            </motion.span>
            Refresh
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 text-xs text-white font-mono bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 px-3 py-1.5 rounded-xl transition-colors"
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? 'Cancel' : 'New Article'}
          </button>
        </div>
      </div>

      {/* New Article Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateArticle}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-5 border border-neon-cyan/20 space-y-4">
              <p className="text-xs font-mono text-neon-cyan uppercase tracking-wider">Publish New Article</p>
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Article headline..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 focus:border-neon-cyan focus:outline-none text-white rounded-xl text-sm placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Summary</label>
                <textarea
                  required
                  value={formSummary}
                  onChange={e => setFormSummary(e.target.value)}
                  placeholder="Article summary..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 focus:border-neon-cyan focus:outline-none text-white rounded-xl text-sm placeholder-gray-600 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d1222] border border-white/10 focus:border-neon-cyan focus:outline-none text-white rounded-xl text-xs font-mono"
                >
                  {Object.keys(categoryColors).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-[10px] text-red-400 font-mono">{formError}</p>}
              <button
                type="submit"
                disabled={submittingArticle}
                className="flex items-center gap-2 text-xs font-mono text-white bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/30 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {submittingArticle ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {submittingArticle ? 'Publishing...' : 'Publish Article'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loadingArticles ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-500 font-mono">
          <Loader2 size={14} className="animate-spin text-neon-cyan" />
          Loading articles...
        </div>
      ) : (
        <div className="space-y-3">
          {articles.length === 0 && (
            <div className="py-10 text-center text-xs text-gray-600 font-mono">
              No articles yet. Use the form above to publish one.
            </div>
          )}
          {articles.map((article) => {
            const artId = article._id || article.id
            const color = categoryColors[article.category] || '#00d4ff'
            const isExpanded = expanded === artId
            const articleComments = comments[artId] || []
            const isLoading = loading[artId]
            const error = errors[artId]

            return (
              <motion.div key={artId} layout className="glass rounded-2xl overflow-hidden border border-white/5">
                {/* Article Header */}
                <div
                  className="w-full flex items-center justify-between p-4 text-left group hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleExpand(artId)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{article.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono" style={{ color }}>{article.category}</span>
                        <span className="text-[10px] text-gray-600">{article.date}</span>
                        {articleComments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <MessageSquare size={10} />
                            {articleComments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      onClick={(e) => handleDeleteArticle(artId, e)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete article"
                    >
                      <Trash2 size={12} />
                    </button>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} className="text-gray-500" />
                    </motion.div>
                  </div>
                </div>

                {/* Comments Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-500 font-mono">
                            <Loader2 size={14} className="animate-spin text-neon-cyan" />
                            Loading comments...
                          </div>
                        ) : error ? (
                          <div className="flex items-center gap-2 text-xs text-red-400 py-4 font-mono">
                            <AlertCircle size={12} />
                            {error}
                          </div>
                        ) : articleComments.length === 0 ? (
                          <p className="text-xs text-gray-600 font-mono py-4 text-center">No comments yet.</p>
                        ) : (
                          <AnimatePresence>
                            {articleComments.map(comment => (
                              <CommentRow
                                key={comment._id || comment.id}
                                comment={comment}
                                onDelete={(cid) => handleDelete(artId, cid)}
                                onTogglePin={(cid) => handleTogglePin(artId, cid)}
                              />
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
