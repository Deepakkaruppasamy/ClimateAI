import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, CheckCircle, XCircle, Clock, RefreshCw, Loader2, AlertCircle, TrendingUp } from 'lucide-react'

const STATUS_CONFIG = {
  pending:  { color: '#ffcc00', bg: 'rgba(255,204,0,0.08)',  border: 'rgba(255,204,0,0.2)',  icon: Clock,        label: 'PENDING'  },
  approved: { color: '#06ffd4', bg: 'rgba(6,255,212,0.08)', border: 'rgba(6,255,212,0.2)', icon: CheckCircle,  label: 'APPROVED' },
  rejected: { color: '#ff4444', bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.2)', icon: XCircle,      label: 'REJECTED' },
}

const DEMO_REQUESTS = [
  { _id: 'demo-1', userId: 'user_alpha', projectId: 'PROJ-2024-GHG', amount: 150, status: 'pending',  createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { _id: 'demo-2', userId: 'user_beta',  projectId: 'PROJ-2023-WIND', amount: 220, status: 'approved', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  { _id: 'demo-3', userId: 'user_gamma', projectId: 'PROJ-2024-SOLAR', amount: 80, status: 'rejected', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { _id: 'demo-4', userId: 'user_delta', projectId: 'PROJ-2025-BIOFUEL', amount: 310, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
]

function RequestRow({ req, onApprove, onReject, actionLoading }) {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  const dateStr = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const isLoading = actionLoading === (req._id || req.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      layout
      className="flex items-center gap-4 p-4 rounded-2xl border group transition-colors"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
        <Icon size={15} style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white font-mono truncate">{req.projectId}</span>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-500">
            User: <span className="text-gray-400 font-mono">{String(req.userId).slice(0, 12)}…</span>
          </span>
          <span className="text-xs text-gray-600">{dateStr}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0 mr-1">
        <div className="text-lg font-bold font-outfit" style={{ color: cfg.color }}>
          {req.amount?.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-600 font-mono">credits</div>
      </div>

      {req.status === 'pending' && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
            <>
              <button
                onClick={() => onApprove(req._id || req.id)}
                title="Approve"
                className="p-2 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/25 text-neon-cyan border border-neon-cyan/20 transition-colors"
              >
                <CheckCircle size={13} />
              </button>
              <button
                onClick={() => onReject(req._id || req.id)}
                title="Reject"
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition-colors"
              >
                <XCircle size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function CarbonAudit({ socket }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/carbon/requests')
      const data = await res.json()
      if (res.ok) {
        const items = data.requests || []
        setRequests(items.length > 0 ? items : DEMO_REQUESTS)
        if (data.warning) setError('⚠️ Database offline — showing demo data')
      } else {
        setRequests(DEMO_REQUESTS)
        setError('⚠️ Could not fetch live data — showing demo records')
      }
    } catch {
      setRequests(DEMO_REQUESTS)
      setError('⚠️ Network error — showing demo records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  useEffect(() => {
    if (!socket) return
    const onCreated = (req) => setRequests(prev => [req, ...prev])
    const onUpdated = (req) => setRequests(prev =>
      prev.map(r => (r._id || r.id) === (req._id || req.id) ? req : r)
    )
    socket.on('carbon:request-created', onCreated)
    socket.on('carbon:status-updated', onUpdated)
    return () => {
      socket.off('carbon:request-created', onCreated)
      socket.off('carbon:status-updated', onUpdated)
    }
  }, [socket])

  const action = async (id, type) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/carbon/${id}/${type}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.request) {
        setRequests(prev => prev.map(r => (r._id || r.id) === id ? data.request : r))
      } else {

        setRequests(prev => prev.map(r =>
          (r._id || r.id) === id ? { ...r, status: type === 'approve' ? 'approved' : 'rejected' } : r
        ))
      }
    } catch {

      setRequests(prev => prev.map(r =>
        (r._id || r.id) === id ? { ...r, status: type === 'approve' ? 'approved' : 'rejected' } : r
      ))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRequests(true)
    setRefreshing(false)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const counts = { all: requests.length, pending: requests.filter(r => r.status === 'pending').length, approved: requests.filter(r => r.status === 'approved').length, rejected: requests.filter(r => r.status === 'rejected').length }
  const totalCredits = requests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.amount || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-neon-cyan" />
          <h3 className="text-lg font-semibold text-white font-display">Carbon Audit</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neon-cyan glass px-3 py-1.5 rounded-xl transition-colors"
        >
          <motion.span animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.7, ease: 'linear' }}>
            <RefreshCw size={12} />
          </motion.span>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests', value: counts.all, color: '#00d4ff' },
          { label: 'Pending Review', value: counts.pending, color: '#ffcc00' },
          { label: 'Approved', value: counts.approved, color: '#06ffd4' },
          { label: 'Credits Approved', value: `${totalCredits.toLocaleString()}`, color: '#7c3aed', suffix: ' t' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold font-outfit" style={{ color }}>{value}{suffix || ''}</div>
            <div className="text-[10px] text-gray-500 mt-1 font-mono">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] font-mono px-3 py-1.5 rounded-xl transition-all capitalize ${
              filter === f
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                : 'glass text-gray-500 hover:text-gray-300 border border-white/5'
            }`}
          >
            {f} {counts[f] > 0 ? `(${counts[f]})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 font-mono">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-gray-500 font-mono">
          <Loader2 size={14} className="animate-spin text-neon-cyan" />
          Loading carbon requests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-600 font-mono glass rounded-2xl border border-white/5">
          No {filter !== 'all' ? filter : ''} requests found.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(req => (
              <RequestRow
                key={req._id || req.id}
                req={req}
                onApprove={(id) => action(id, 'approve')}
                onReject={(id) => action(id, 'reject')}
                actionLoading={actionLoading}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
