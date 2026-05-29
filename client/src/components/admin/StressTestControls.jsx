import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Activity, Shield, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight, Gauge, Clock, RefreshCw } from 'lucide-react'

const DEFAULT_FLAGS = { enabled: false, latencyMs: 3000, rateLimitChance: 0.5 }

function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-400 font-mono">{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

export default function StressTestControls({ socket }) {
  const [flags, setFlags] = useState(DEFAULT_FLAGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [testLog, setTestLog] = useState([])

  // Fetch current flags from server
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/stress/status')
      const data = await res.json()
      if (res.ok && data.flags) setFlags(data.flags)
    } catch {
      setFetchError('Could not reach stress API')
    }
  }

  useEffect(() => { fetchStatus() }, [])

  // Sync when another admin toggles via socket
  useEffect(() => {
    if (!socket) return
    const onUpdate = (f) => setFlags(f)
    socket.on('admin:stress-test-updated', onUpdate)
    return () => socket.off('admin:stress-test-updated', onUpdate)
  }, [socket])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/stress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      })
      const data = await res.json()
      if (res.ok) {
        setFlags(data.flags)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        addLog(`Stress mode ${data.flags.enabled ? 'ENABLED' : 'DISABLED'} — ${data.flags.latencyMs}ms latency, ${Math.round(data.flags.rateLimitChance * 100)}% 429 chance`)
      }
    } catch {
      addLog('⚠️ Failed to update stress flags')
    } finally {
      setSaving(false)
    }
  }

  const addLog = (msg) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
    setTestLog(prev => [{ ts, msg }, ...prev].slice(0, 20))
  }

  const handleQuickTest = async () => {
    addLog('Sending test probe to /api/health…')
    const start = Date.now()
    try {
      const res = await fetch('/api/health')
      const ms = Date.now() - start
      if (res.status === 429) {
        addLog(`⚡ 429 rate-limit received in ${ms}ms`)
      } else {
        addLog(`✅ 200 OK in ${ms}ms`)
      }
    } catch (e) {
      addLog(`❌ Request failed: ${e.message}`)
    }
  }

  const latencyLabel = flags.latencyMs < 1000
    ? `${flags.latencyMs}ms`
    : `${(flags.latencyMs / 1000).toFixed(1)}s`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap size={16} className={flags.enabled ? 'text-amber-400' : 'text-gray-500'} />
        <h3 className="text-lg font-semibold text-white font-display">Stress Testing</h3>
        {flags.enabled && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30"
          >
            ACTIVE
          </motion.span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Controls Panel */}
        <div className="glass-strong rounded-2xl p-5 border border-white/5 space-y-5">
          <h4 className="text-sm font-semibold text-white font-display flex items-center gap-2">
            <Gauge size={14} className="text-neon-blue" />
            Stress Parameters
          </h4>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Enable Stress Mode</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Applies latency + random rate-limits globally</p>
            </div>
            <button
              onClick={() => setFlags(f => ({ ...f, enabled: !f.enabled }))}
              className="transition-colors"
            >
              {flags.enabled
                ? <ToggleRight size={28} className="text-amber-400" />
                : <ToggleLeft size={28} className="text-gray-600" />
              }
            </button>
          </div>

          {/* Latency Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                <Clock size={12} />
                Artificial Latency
              </div>
              <span className="font-bold text-neon-blue font-mono">{latencyLabel}</span>
            </div>
            <input
              type="range"
              min={100}
              max={10000}
              step={100}
              value={flags.latencyMs}
              onChange={e => setFlags(f => ({ ...f, latencyMs: Number(e.target.value) }))}
              className="w-full accent-neon-blue"
              disabled={!flags.enabled}
            />
            <div className="flex justify-between text-[10px] text-gray-600 font-mono">
              <span>100ms</span>
              <span>10s</span>
            </div>
          </div>

          {/* Rate Limit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                <Shield size={12} />
                Rate-limit Probability
              </div>
              <span className="font-bold text-neon-purple font-mono">{Math.round(flags.rateLimitChance * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={flags.rateLimitChance}
              onChange={e => setFlags(f => ({ ...f, rateLimitChance: Number(e.target.value) }))}
              className="w-full accent-neon-purple"
              disabled={!flags.enabled}
            />
            <div className="flex justify-between text-[10px] text-gray-600 font-mono">
              <span>0% (never)</span>
              <span>100% (always)</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Light', ms: 500, chance: 0.1, color: '#06ffd4' },
              { label: 'Heavy', ms: 3000, chance: 0.5, color: '#ffcc00' },
              { label: 'Extreme', ms: 8000, chance: 0.9, color: '#ff4444' },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => setFlags(f => ({ ...f, latencyMs: preset.ms, rateLimitChance: preset.chance }))}
                className="py-1.5 rounded-xl text-[11px] font-mono font-semibold border transition-all hover:scale-105"
                style={{ color: preset.color, borderColor: `${preset.color}30`, background: `${preset.color}10` }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Apply / Test buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                saved
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  : flags.enabled
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
                  : 'bg-gradient-to-r from-neon-blue to-blue-600 text-white hover:shadow-lg'
              } disabled:opacity-50`}
            >
              {saved ? <CheckCircle size={12} /> : <Zap size={12} />}
              {saved ? 'Applied!' : saving ? 'Applying…' : 'Apply Flags'}
            </button>
            <button
              onClick={handleQuickTest}
              className="px-4 py-2.5 glass border border-white/10 text-gray-400 hover:text-neon-blue rounded-xl text-xs font-mono transition-colors"
            >
              Quick Test
            </button>
          </div>
        </div>

        {/* Status + Log Panel */}
        <div className="space-y-4">
          {/* Current Status */}
          <div className="glass rounded-2xl p-4 border border-white/5">
            <h4 className="text-sm font-semibold text-white font-display flex items-center gap-2 mb-3">
              <Activity size={14} className="text-neon-cyan" />
              Current State
            </h4>
            <StatPill
              label="Mode"
              value={flags.enabled ? '🔴 STRESS ACTIVE' : '🟢 NORMAL'}
              color={flags.enabled ? '#ff4444' : '#06ffd4'}
            />
            <StatPill label="Injected Latency" value={latencyLabel} color="#00d4ff" />
            <StatPill label="429 Rate-limit Chance" value={`${Math.round(flags.rateLimitChance * 100)}%`} color="#7c3aed" />
            <StatPill
              label="Expected Avg Latency"
              value={flags.enabled ? `~${Math.round(flags.latencyMs * (1 - flags.rateLimitChance))}ms` : 'Normal'}
              color="#ff8800"
            />
          </div>

          {/* Warning Banner when enabled */}
          <AnimatePresence>
            {flags.enabled && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25"
              >
                <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300 font-mono leading-relaxed">
                  Stress mode is <strong>ACTIVE</strong>. All API routes are experiencing {latencyLabel} artificial latency and a {Math.round(flags.rateLimitChance * 100)}% chance of 429 errors. This affects all connected clients.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test Log */}
          <div className="glass rounded-2xl p-4 border border-white/5">
            <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Test Log</h4>
            {testLog.length === 0 ? (
              <p className="text-xs text-gray-600 font-mono text-center py-4">Run "Quick Test" to see probe results.</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                <AnimatePresence>
                  {testLog.map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 text-[11px] font-mono"
                    >
                      <span className="text-gray-600 flex-shrink-0">{entry.ts}</span>
                      <span className="text-gray-300">{entry.msg}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
