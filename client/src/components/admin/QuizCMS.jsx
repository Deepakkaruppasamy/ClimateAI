import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Trash2, Edit3, Zap, CheckCircle, AlertCircle, Loader2, X, Save } from 'lucide-react'

const EMPTY_Q = { question: '', options: ['', '', '', ''], answer: '' }

function QuestionCard({ q, onDelete, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      layout
      className="glass rounded-2xl p-4 border border-white/5 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-xl bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpen size={12} className="text-neon-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-2 leading-snug">{q.question}</p>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {(q.options || []).filter(o => o).map((opt, i) => (
              <div key={i} className={`text-[11px] px-2 py-1 rounded-lg font-mono truncate ${opt === q.answer ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                {opt === q.answer && '✓ '}{opt}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-600 font-mono">
            {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(q)} className="p-1.5 rounded-lg bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue transition-colors">
            <Edit3 size={12} />
          </button>
          <button onClick={() => onDelete(q._id || q.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function QuestionForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_Q)

  const setOption = (i, val) => {
    const opts = [...form.options]
    opts[i] = val
    setForm(f => ({ ...f, options: opts }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.question || !form.answer) return
    onSave(form)
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-strong rounded-2xl p-5 border border-neon-purple/20 space-y-4"
    >
      <h4 className="text-sm font-semibold text-white font-display">
        {initial?._id ? 'Edit Question' : 'New Question'}
      </h4>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">Question</label>
        <textarea
          required
          rows={2}
          value={form.question}
          onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
          placeholder="Enter the quiz question..."
          className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-neon-purple focus:outline-none text-white rounded-xl text-sm resize-none placeholder-gray-600"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">Answer Options</label>
        <div className="grid grid-cols-2 gap-2">
          {form.options.map((opt, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => setOption(i, e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 focus:border-neon-purple focus:outline-none text-white rounded-xl text-xs placeholder-gray-600"
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">Correct Answer</label>
        <select
          required
          value={form.answer}
          onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
          className="w-full px-3 py-2 bg-[#0d1222] border border-white/10 focus:border-neon-purple focus:outline-none text-white rounded-xl text-sm"
        >
          <option value="">Select correct answer…</option>
          {form.options.filter(o => o).map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-neon-purple to-violet-600 text-white rounded-xl text-xs font-mono font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Saving…' : 'Save Question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 glass border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-mono transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  )
}

export default function QuizCMS({ socket }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingQ, setEditingQ] = useState(null)
  const [saving, setSaving] = useState(false)
  const [challengeSent, setChallengeSent] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/quiz/questions')
      const data = await res.json()
      if (res.ok) setQuestions(data.questions || [])
      else setError(data.error || 'Failed to load questions')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuestions() }, [])

  useEffect(() => {
    if (!socket) return
    const onAdded = (q) => setQuestions(prev => {
      const qId = q._id || q.id;
      if (prev.some(p => (p._id || p.id) === qId)) return prev;
      return [...prev, q];
    })
    const onUpdated = (q) => setQuestions(prev => prev.map(p => (p._id || p.id) === (q._id || q.id) ? q : p))
    const onDeleted = ({ id }) => setQuestions(prev => prev.filter(p => (p._id || p.id) !== id))
    socket.on('quiz:question-added', onAdded)
    socket.on('quiz:question-updated', onUpdated)
    socket.on('quiz:question-deleted', onDeleted)
    return () => {
      socket.off('quiz:question-added', onAdded)
      socket.off('quiz:question-updated', onUpdated)
      socket.off('quiz:question-deleted', onDeleted)
    }
  }, [socket])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      const isEdit = !!editingQ?._id
      const url = isEdit ? `/api/quiz/questions/${editingQ._id}` : '/api/quiz/questions'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'multiple-choice' })
      })
      const data = await res.json()
      if (res.ok) {
        if (isEdit) setQuestions(prev => prev.map(p => (p._id || p.id) === editingQ._id ? data.question : p))
        else setQuestions(prev => [...prev, data.question])
        setShowForm(false)
        setEditingQ(null)
      } else {
        setError(data.error || 'Save failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/quiz/questions/${id}`, { method: 'DELETE' })
      setQuestions(prev => prev.filter(p => (p._id || p.id) !== id))
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const handleChallenge = async () => {
    try {
      await fetch('/api/quiz/challenge', { method: 'POST' })
      setChallengeSent(true)
      setTimeout(() => setChallengeSent(false), 3000)
    } catch (e) {
      console.error('Challenge failed:', e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-neon-purple" />
          <h3 className="text-lg font-semibold text-white font-display">Quiz CMS</h3>
          <span className="text-xs text-gray-500 font-mono">({questions.length} questions)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleChallenge}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-mono transition-all ${challengeSent ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'glass border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10'}`}
          >
            {challengeSent ? <CheckCircle size={12} /> : <Zap size={12} />}
            {challengeSent ? 'Dispatched!' : 'Daily Challenge'}
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingQ(null) }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-mono bg-gradient-to-r from-neon-purple to-violet-600 text-white hover:shadow-lg transition-all"
          >
            <Plus size={12} />
            Add Question
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(showForm || editingQ) && (
          <QuestionForm
            initial={editingQ}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingQ(null) }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-mono">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-gray-500 font-mono">
          <Loader2 size={14} className="animate-spin text-neon-purple" />
          Loading quiz database…
        </div>
      ) : questions.length === 0 && !showForm ? (
        <div className="py-12 text-center text-xs text-gray-600 font-mono glass rounded-2xl border border-white/5">
          No questions yet. Click "Add Question" to create your first entry.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <AnimatePresence>
            {questions.map(q => (
              <QuestionCard
                key={q._id || q.id}
                q={q}
                onDelete={handleDelete}
                onEdit={(q) => { setEditingQ(q); setShowForm(false) }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
