import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowRight, Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VideoBackground from '../components/ui/VideoBackground'

export default function Login() {
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Form states
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validations
    if (!email || !password) {
      setError('Please fill in all credentials.')
      return
    }

    if (!isLogin && !name) {
      setError('Please provide your name to register.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(name, email, password)
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle modes
  const handleToggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#070a13]">
      {/* Background Video */}
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_133010_cb9c806d-bc9d-47f1-ac4c-b1759134ec8b.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-10 pointer-events-none z-[3]" />

      {/* Main Glass Authentication Card */}
      <motion.div
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong rounded-3xl p-8 md:p-10 max-w-md w-full mx-4 z-10 border border-white/10 shadow-2xl relative"
      >
        {/* Glow Accent */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-blue/20 rounded-full blur-[50px] pointer-events-none" />

        {/* Logo Icon */}
        <motion.div 
          className="w-16 h-16 mb-6 mx-auto relative flex items-center justify-center"
        >
          <img src="/logo.png" alt="ClimateAI Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]" />
        </motion.div>

        <motion.div className="text-center">
          <span className="label-overline mb-2 inline-block">Security Portal</span>
          <h1 className="text-white text-3xl font-normal mb-2 font-display">
            {isLogin ? 'Access ' : 'Join '}<span className="gradient-text">ClimateAI</span>
          </h1>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            {isLogin 
              ? 'Enter credentials to access neural climate forecasting and smart recommendations.' 
              : 'Create an account to gain full intelligence suite analytics and real-time tracking.'}
          </p>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 text-left font-mono"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Carter"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-neon-blue focus:outline-none text-white rounded-xl text-sm transition-all font-sans placeholder-gray-500"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 block">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.carter@gmail.com"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-neon-blue focus:outline-none text-white rounded-xl text-sm transition-all font-sans placeholder-gray-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-neon-blue focus:outline-none text-white rounded-xl text-sm transition-all font-sans placeholder-gray-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3.5 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/90 hover:to-neon-purple/90 text-white rounded-xl font-semibold shadow-lg hover:shadow-neon-blue/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                <span>Decrypting credentials...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} className="text-white" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <motion.div className="mt-6 text-center">
          <button
            onClick={handleToggleMode}
            className="text-gray-400 hover:text-white transition-colors text-xs font-mono"
          >
            {isLogin 
              ? "Don't have an account? Sign Up" 
              : 'Already have an account? Log In'}
          </button>
        </motion.div>

        {/* Info Text */}
        <motion.div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-white/5 text-[10px] text-gray-500 font-mono">
          <Shield size={12} className="text-neon-cyan" />
          <span>PBKDF2 secure credential validation</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
