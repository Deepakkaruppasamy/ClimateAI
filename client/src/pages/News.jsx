import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, MessageSquare, ThumbsUp, Send, Loader2, ArrowRight, ShieldCheck, HelpCircle, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import VideoBackground from '../components/ui/VideoBackground'
import { playTap, playHover, playRadioStatic } from '../utils/audio'

export default function News() {
  const { user } = useAuth()
  const { socket } = useSocket()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('articles') // 'articles' | 'live'

  // News articles states
  const [articles, setArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [errorArticles, setErrorArticles] = useState('')
  
  // Live feed state
  const [liveArticles, setLiveArticles] = useState([])
  const [loadingLive, setLoadingLive] = useState(false)
  const [liveError, setLiveError] = useState('')
  
  // Likes state (local UI simulation)
  const [likedArticles, setLikedArticles] = useState([])

  // Active article selected for discussion
  const [activeArticle, setActiveArticle] = useState(null)
  
  // Voice readout narration state
  const [narratingId, setNarratingId] = useState(null)
  
  // Comments states
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [errorComment, setErrorComment] = useState('')

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  // AI voice readout controller
  const handleListen = (art) => {
    playTap()
    
    if (narratingId === art.id) {
      window.speechSynthesis?.cancel()
      setNarratingId(null)
      playRadioStatic()
      return
    }

    window.speechSynthesis?.cancel()
    playRadioStatic()
    
    const textToRead = `${art.title}. Summary: ${art.summary}`
    const utterance = new SpeechSynthesisUtterance(textToRead)
    
    // Select standard English robot-like profile
    const voices = window.speechSynthesis?.getVoices() || []
    const cleanVoice = voices.find(v => v.lang.includes('en-US') && v.name.toLowerCase().includes('google')) 
      || voices.find(v => v.lang.includes('en'))
    
    if (cleanVoice) utterance.voice = cleanVoice
    utterance.pitch = 0.85 // Futuristic mechanical low pitch
    utterance.rate = 1.05  // Snappy transmission reading
    
    utterance.onend = () => {
      setNarratingId(null)
      playRadioStatic()
    }
    
    utterance.onerror = () => {
      setNarratingId(null)
    }

    setNarratingId(art.id)
    window.speechSynthesis?.speak(utterance)
  }


  // Fetch all articles
  const fetchArticles = async () => {
    setLoadingArticles(true)
    setErrorArticles('')
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (res.ok && data.articles) {
        setArticles(data.articles)
      } else {
        setErrorArticles('Failed to load articles feed.')
      }
    } catch (e) {
      setErrorArticles('Error connecting to backend news server.')
    } finally {
      setLoadingArticles(false)
    }
  }

  // Fetch comments for an article
  const fetchComments = async (articleId) => {
    setLoadingComments(true)
    setErrorComment('')
    try {
      const res = await fetch(`/api/news/${articleId}/comments`)
      const data = await res.json()
      if (res.ok && data.comments) {
        setComments(data.comments)
      } else {
        setErrorComment('Failed to load discussions.')
      }
    } catch (e) {
      setErrorComment('Error fetching comment registry.')
    } finally {
      setLoadingComments(false)
    }
  }

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmittingComment(true)
    setErrorComment('')
    
    try {
      const res = await fetch(`/api/news/${activeArticle.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user?.name || 'Anonymous User',
          userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          content: newComment
        })
      })

      const data = await res.json()
      if (res.ok && data.comment) {
        setComments([data.comment, ...comments])
        setNewComment('')
      } else {
        setErrorComment(data.error || 'Failed to submit comment.')
      }
    } catch (err) {
      setErrorComment('Backend server unreachable.')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Handle local like toggle
  const handleLikeToggle = (artId) => {
    if (likedArticles.includes(artId)) {
      setLikedArticles(likedArticles.filter(id => id !== artId))
    } else {
      setLikedArticles([...likedArticles, artId])
    }
  }

  // Fetch live climate news
  const fetchLiveNews = async () => {
    setLoadingLive(true)
    setLiveError('')
    try {
      const res = await fetch('/api/news/live')
      const data = await res.json()
      if (res.ok && data.articles) {
        setLiveArticles(data.articles)
      } else {
        setLiveError('Failed to load live feed.')
      }
    } catch (e) {
      setLiveError('Could not connect to live news stream.')
    } finally {
      setLoadingLive(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  // Fetch live news when tab switches to live, then auto-refresh every 30 min
  useEffect(() => {
    if (activeTab !== 'live') return
    if (liveArticles.length === 0) fetchLiveNews()
    const timer = setInterval(fetchLiveNews, 30 * 60 * 1000)
    return () => clearInterval(timer)
  }, [activeTab])

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return
    const onAdded = (article) => setArticles(prev => [article, ...prev])
    const onUpdated = (article) => setArticles(prev =>
      prev.map(a => (a._id || a.id) === (article._id || article.id) ? { ...a, ...article } : a)
    )
    const onDeleted = ({ id }) => {
      setArticles(prev => prev.filter(a => (a._id || a.id) !== id))
      setActiveArticle(prev => (prev && (prev._id || prev.id) === id) ? null : prev)
    }
    const onCommentAdded = ({ articleId, comment }) => {
      if (activeArticle && (activeArticle._id || activeArticle.id) === articleId) {
        setComments(prev => [comment, ...prev])
      }
    }
    socket.on('news:article-added', onAdded)
    socket.on('news:article-updated', onUpdated)
    socket.on('news:article-deleted', onDeleted)
    socket.on('news:comment-added', onCommentAdded)
    return () => {
      socket.off('news:article-added', onAdded)
      socket.off('news:article-updated', onUpdated)
      socket.off('news:article-deleted', onDeleted)
      socket.off('news:comment-added', onCommentAdded)
    }
  }, [socket, activeArticle])

  useEffect(() => {
    if (activeArticle) {
      fetchComments(activeArticle.id)
    }
  }, [activeArticle])

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#070a13] text-white">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">
        
        {/* Title + Tab selector */}
        <div className="mb-10 text-center md:text-left">
          <span className="label-overline mb-2 inline-block">Global Intelligence Hub</span>
          <h1 className="text-4xl lg:text-5xl font-light font-display">
            Climate Policy & <span className="gradient-text">Tech News</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mt-1">
            Browse aggregated news reports, updates, and innovations on carbon capturing systems, global treaties, and participate in discussion threads.
          </p>
          {/* Tab pills */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => { playTap(); setActiveTab('articles') }}
              onMouseEnter={playHover}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-mono transition-all ${
                activeTab === 'articles'
                  ? 'bg-neon-blue/15 border-neon-blue text-neon-blue font-bold shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                  : 'glass hover:bg-white/10 border-white/10 text-gray-400'
              }`}
            >
              <Newspaper size={12} />
              CURATED ARTICLES
            </button>
            <button
              onClick={() => { playTap(); setActiveTab('live') }}
              onMouseEnter={playHover}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-mono transition-all ${
                activeTab === 'live'
                  ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan font-bold shadow-[0_0_15px_rgba(6,255,212,0.15)]'
                  : 'glass hover:bg-white/10 border-white/10 text-gray-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              LIVE FEED
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Articles Feed */}
          <div className={`${activeArticle ? 'xl:col-span-7' : 'xl:col-span-12'} space-y-6 transition-all duration-300`}>

            {/* ── LIVE FEED TAB ── */}
            {activeTab === 'live' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                    <span className="text-xs font-mono text-neon-cyan uppercase tracking-wider">Live Climate Intelligence Stream</span>
                  </div>
                  <button onClick={fetchLiveNews} className="glass px-3 py-1.5 rounded-xl text-[10px] font-mono text-gray-400 hover:text-white border border-white/5 hover:border-white/10 transition-all">
                    ↺ REFRESH
                  </button>
                </div>
                {loadingLive ? (
                  <div className="py-16 text-center space-y-4">
                    <Loader2 size={32} className="animate-spin text-neon-cyan mx-auto" />
                    <span className="text-xs font-mono text-gray-500">Scanning global climate news streams...</span>
                  </div>
                ) : liveError ? (
                  <div className="py-16 text-center text-red-400 text-sm font-mono border border-red-500/10 bg-red-500/5 rounded-3xl">{liveError}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveArticles.map((art) => (
                      <motion.div
                        key={art.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-strong rounded-3xl p-6 border border-neon-cyan/10 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-neon-cyan/25 transition-all"
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan uppercase tracking-wider border border-neon-cyan/20">{art.category}</span>
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />LIVE
                              </span>
                            </div>
                            <span>{art.date}</span>
                          </div>
                          <h2 className="text-white text-base font-normal mb-3 font-display leading-snug group-hover:text-neon-cyan transition-colors">{art.title}</h2>
                          <p className="text-gray-400 text-xs leading-normal mb-4">{art.summary}</p>
                        </div>
                        {art.url && (
                          <a href={art.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="flex items-center justify-between border-t border-white/5 pt-4 mt-2 text-xs font-mono text-neon-blue hover:text-white transition-colors">
                            <span>READ FULL STORY</span>
                            <ArrowRight size={12} />
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CURATED ARTICLES TAB ── */}
            {activeTab === 'articles' && (
              loadingArticles ? (
              <div className="py-24 text-center space-y-4">
                <Loader2 size={36} className="animate-spin text-neon-blue mx-auto" />
                <span className="text-xs font-mono text-gray-500">Querying international news registries...</span>
              </div>
            ) : errorArticles ? (
              <div className="py-24 text-center text-red-400 text-sm font-mono border border-red-500/10 bg-red-500/5 rounded-3xl">
                {errorArticles}
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${activeArticle ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                {articles.map((art) => {
                  const hasLiked = likedArticles.includes(art.id)
                  const likeCount = art.likes + (hasLiked ? 1 : 0)
                  return (
                    <motion.div
                      layout
                      key={art.id}
                      onClick={() => setActiveArticle(art)}
                      className={`glass-strong rounded-3xl p-6 border transition-all cursor-pointer shadow-2xl flex flex-col justify-between relative overflow-hidden group ${
                        activeArticle?.id === art.id 
                          ? 'border-neon-blue shadow-neon-blue/10 bg-neon-blue/5' 
                          : 'border-white/5 hover:border-white/10 hover:shadow-neon-blue/5'
                      }`}
                      onMouseEnter={playHover}
                    >
                      {/* Laser decoder sweep overlay */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-350 z-10">
                        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent laser-sweep" />
                        
                        {/* Corner Crosshairs */}
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-neon-cyan/40 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300" />
                        <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-neon-cyan/40 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300" />
                        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-neon-cyan/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-neon-cyan/40 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                        
                        {/* Ingestion Telemetry */}
                        <div className="absolute bottom-3 right-4 text-[7px] font-mono text-neon-cyan/50 tracking-widest uppercase select-none font-bold">
                          SECURE_DECODING // OK
                        </div>
                      </div>

                      <div className="relative z-20">
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-white/5 text-neon-cyan uppercase tracking-wider">{art.category}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleListen(art)
                              }}
                              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 z-30 ${
                                narratingId === art.id 
                                  ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan font-bold' 
                                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                              }`}
                              title={narratingId === art.id ? "Stop Listening" : "Listen to AI Report"}
                            >
                              {narratingId === art.id ? (
                                <>
                                  <VolumeX size={10} className="animate-pulse" />
                                  <span className="text-[8px] tracking-wide">MUTE</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={10} />
                                  <span className="text-[8px] tracking-wide">LISTEN</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {narratingId === art.id && (
                              <div className="flex items-center gap-0.5 h-3 shrink-0">
                                <div className="w-[1.5px] h-2 bg-neon-cyan eq-bar-1" style={{ animationDelay: '0.1s' }} />
                                <div className="w-[1.5px] h-3 bg-neon-cyan eq-bar-2" style={{ animationDelay: '0.3s' }} />
                                <div className="w-[1.5px] h-1.5 bg-neon-cyan eq-bar-3" style={{ animationDelay: '0.2s' }} />
                                <div className="w-[1.5px] h-2.5 bg-neon-cyan eq-bar-4" style={{ animationDelay: '0.4s' }} />
                              </div>
                            )}
                            <span>{art.date}</span>
                          </div>
                        </div>
                        <h2 className="text-white text-lg font-normal mb-3 font-display leading-snug group-hover:text-neon-cyan transition-colors" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{art.title}</h2>
                        <p className="text-gray-400 text-xs leading-normal mb-6 truncate-3-lines">{art.summary}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6 relative z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            playTap()
                            handleLikeToggle(art.id)
                          }}
                          className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${
                            hasLiked ? 'text-neon-pink' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <ThumbsUp size={12} fill={hasLiked ? 'currentColor' : 'none'} />
                          <span>{likeCount} Reacts</span>
                        </button>

                        <span className="flex items-center gap-1 text-xs font-mono text-neon-blue hover:text-white transition-colors">
                          <span>DISCUSS</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Discussion comments area */}
          <AnimatePresence>
            {activeArticle && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="xl:col-span-5 glass-strong rounded-3xl p-6 border border-white/10 shadow-2xl relative space-y-6"
              >
                {/* Header info */}
                <div className="border-b border-white/5 pb-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest">[ DISCUSSION HUB ]</span>
                    <h3 className="text-white font-display text-lg mt-1">{activeArticle.title}</h3>
                  </div>
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="text-xs text-gray-500 hover:text-white font-mono"
                  >
                    CLOSE
                  </button>
                </div>

                {/* Submit comment form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your perspective on this policy..."
                      rows={2}
                      maxLength={300}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-neon-blue focus:outline-none text-white rounded-xl text-xs font-sans placeholder-gray-500 resize-none pr-10"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="absolute right-3 bottom-3 p-2 bg-neon-blue hover:bg-neon-blue/80 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    </button>
                  </div>
                  
                  {errorComment && (
                    <span className="text-[10px] text-red-400 font-mono block">{errorComment}</span>
                  )}
                </form>

                {/* Comments feed */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingComments ? (
                    <div className="py-8 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-neon-blue" />
                      <span>Retrieving community comments...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-gray-500">
                      No comments posted yet. Be the first to share!
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start gap-3"
                      >
                        <img 
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10" 
                          src={comment.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                          alt="avatar" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-white font-medium truncate">{comment.userName}</span>
                            <span className="text-[9px] text-gray-500 font-mono flex-shrink-0">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1 leading-normal font-sans">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
