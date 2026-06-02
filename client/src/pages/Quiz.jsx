import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, ShieldCheck, Loader2, ArrowRight, RefreshCw, Award, Sparkles, Calendar, Play } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useAuth } from '../context/AuthContext'
import VideoBackground from '../components/ui/VideoBackground'
import ShareCard from '../components/ui/ShareCard'
import { playTap, playHover, playSuccess, playError } from '../utils/audio'

const QUIZ_QUESTIONS = [
  {
    question: 'Which of the following greenhouse gases has the highest warming potential relative to CO2 over a 100-year cycle?',
    options: ['Methane (CH4)', 'Nitrous Oxide (N2O)', 'Fluorinated Gases (F-Gases)', 'Water Vapor'],
    answer: 2, 
    expl: 'Fluorinated gases (F-gases) have global warming potentials (GWP) that can be thousands of times stronger than CO2 over 100 years.'
  },
  {
    question: 'Under the IPCC RCP 8.5 (Business As Usual) pathway, global average temperatures in 2100 are projected to rise by how much?',
    options: ['1.5°C - 2.0°C', '2.5°C - 3.2°C', '3.5°C - 4.8°C', 'Over 6.0°C'],
    answer: 2,
    expl: 'RCP 8.5 projects temperature anomalies reaching between 3.5°C and 4.8°C above pre-industrial averages by 2100.'
  },
  {
    question: 'What percentage of global greenhouse emissions is estimated to come from agriculture and forestry land-use systems?',
    options: ['~5%', '~12%', '~22%', '~40%'],
    answer: 2,
    expl: 'Land use, agriculture, and forestry systems are responsible for roughly 22-24% of annual global greenhouse gas emissions.'
  },
  {
    question: 'Which carbon sequestration method captures carbon dioxide directly from ambient air and mineralizes it underground?',
    options: ['Afforestation', 'Direct Air Capture (DAC)', 'Ocean Iron Fertilization', 'Biochar Pyrolysis'],
    answer: 1,
    expl: 'Direct Air Capture (DAC) uses collectors to draw in atmospheric CO2 and permanently sequester it inside rock formations.'
  },
  {
    question: 'What is the primary target threshold for CO2 parts per million (ppm) required to stabilize global temperatures below +1.5°C?',
    options: ['350 ppm', '450 ppm', '550 ppm', '650 ppm'],
    answer: 0,
    expl: 'Climate scientists estimate that stabilizing CO2 levels back to 350 ppm is required to reverse warming and stabilize under 1.5°C.'
  }
]

export default function Quiz() {
  const { user } = useAuth()
  

  const [leaderboard, setLeaderboard] = useState([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const [errorLeaderboard, setErrorLeaderboard] = useState('')

  const [questions, setQuestions] = useState(QUIZ_QUESTIONS)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [savingScore, setSavingScore] = useState(false)

  const [quizStarted, setQuizStarted] = useState(false)
  const [isDailyChallenge, setIsDailyChallenge] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all') 
  const [selectedDifficulty, setSelectedDifficulty] = useState('all') 

  const [timeLeft, setTimeLeft] = useState(15)
  const [streak, setStreak] = useState(0)
  const [gamblePlayed, setGamblePlayed] = useState(false)
  const [gambleSuccess, setGambleSuccess] = useState(null)
  const [gambleCardChoice, setGambleCardChoice] = useState(null)

  const startNormalQuiz = async () => {
    playTap()
    setIsDailyChallenge(false)
    setLoadingQuestions(true)
    setQuizStarted(true)
    setCompleted(false)
    setActiveQuestion(0)
    setScore(0)
    setStreak(0)
    setTimeLeft(15)
    setGamblePlayed(false)

    try {
      const categoryQuery = selectedCategory !== 'all' ? `category=${selectedCategory}` : ''
      const difficultyQuery = selectedDifficulty !== 'all' ? `difficulty=${selectedDifficulty}` : ''
      const queryString = [categoryQuery, difficultyQuery].filter(Boolean).join('&')
      
      const res = await fetch(`/api/quiz/questions${queryString ? `?${queryString}` : ''}`)
      const data = await res.json()
      
      if (res.ok && data.questions && data.questions.length > 0) {
        const mapped = data.questions.map(q => {
          let answerIndex = 0
          if (typeof q.answer === 'number') {
            answerIndex = q.answer
          } else {
            const idx = q.options.indexOf(q.answer)
            answerIndex = idx !== -1 ? idx : 0
          }
          return {
            question: q.question,
            options: q.options,
            answer: answerIndex,
            expl: q.expl || 'Review ecological guidelines and study materials to learn more.'
          }
        })
        setQuestions(mapped)
      } else {
        setQuestions(QUIZ_QUESTIONS)
      }
    } catch (e) {
      console.warn('⚠️ Failed to load questions from database, using fallback defaults:', e.message)
      setQuestions(QUIZ_QUESTIONS)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const startDailyChallenge = async () => {
    playTap()
    setIsDailyChallenge(true)
    setLoadingQuestions(true)
    setQuizStarted(true)
    setCompleted(false)
    setActiveQuestion(0)
    setScore(0)
    setStreak(0)
    setTimeLeft(15)
    setGamblePlayed(false)

    try {
      const res = await fetch('/api/quiz/daily')
      const data = await res.json()
      if (res.ok && data.questions && data.questions.length > 0) {
        const mapped = data.questions.map(q => {
          let answerIndex = 0
          if (typeof q.answer === 'number') {
            answerIndex = q.answer
          } else {
            const idx = q.options.indexOf(q.answer)
            answerIndex = idx !== -1 ? idx : 0
          }
          return {
            question: q.question,
            options: q.options,
            answer: answerIndex,
            expl: q.expl || 'Review ecological guidelines and study materials to learn more.'
          }
        })
        setQuestions(mapped)
      } else {
        setQuestions(QUIZ_QUESTIONS)
      }
    } catch (e) {
      console.warn('⚠️ Failed to load daily questions:', e.message)
      setQuestions(QUIZ_QUESTIONS)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true)
    setErrorLeaderboard('')
    try {
      const res = await fetch('/api/quiz/leaderboard')
      const data = await res.json()
      if (res.ok && data.leaderboard) {
        setLeaderboard(data.leaderboard)
      } else {
        setErrorLeaderboard('Failed to query active standings.')
      }
    } catch (e) {
      setErrorLeaderboard('Error connecting to quiz server.')
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  const handleOptionSelect = (optIndex) => {
    if (answered) return
    setSelectedOption(optIndex)
    playTap()
  }

  useEffect(() => {
    if (completed || loadingQuestions || answered) return
    if (timeLeft <= 0) {
      setAnswered(true)
      setSelectedOption(-1) 
      setStreak(0)
      playError()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, completed, loadingQuestions, answered])

  const handleLockAnswer = () => {
    if (selectedOption === null || answered) return
    setAnswered(true)
    if (selectedOption === questions[activeQuestion].answer) {
      const nextStreak = streak + 1
      setStreak(nextStreak)
      

      const streakMultiplier = Math.min(4, Math.floor(nextStreak / 2) + 1)
      setScore(score + 1 * streakMultiplier)
      playSuccess()
    } else {
      setStreak(0)
      playError()
    }
  }

  const handleNextQuestion = () => {
    setSelectedOption(null)
    setAnswered(false)
    setTimeLeft(15) 
    playTap()
    
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion(activeQuestion + 1)
    } else {
      handleQuizComplete()
    }
  }

  const handleQuizComplete = async () => {
    setCompleted(true)
    const pointsPercentage = Math.round((score / questions.length) * 100)
    

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00d4ff', '#7c3aed', '#06ffd4', '#ea580c']
    })

    setSavingScore(true)
    try {
      const res = await fetch('/api/quiz/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id || user?.googleId || 'mock',
          userName: user?.name || 'Anonymous Champion',
          score: pointsPercentage,
          xpGained: pointsPercentage
        })
      })
      if (res.ok) {

        fetchLeaderboard()
      }
    } catch (e) {
      console.error('Score submission failed:', e)
    } finally {
      setSavingScore(false)
    }
  }

  const restartQuiz = () => {
    setActiveQuestion(0)
    setSelectedOption(null)
    setAnswered(false)
    setScore(0)
    setCompleted(false)
    setTimeLeft(15)
    setStreak(0)
    setGamblePlayed(false)
    setGambleSuccess(null)
    setQuizStarted(false)
    playTap()
  }

  const triggerGamble = async (choice) => {
    setGambleCardChoice(choice)
    setGamblePlayed(true)
    const success = Math.random() >= 0.5
    
    const baseScorePct = Math.round((score / questions.length) * 100)
    let nextScorePct
    if (success) {
      nextScorePct = Math.min(200, baseScorePct * 2)
      setGambleSuccess(true)
      playSuccess()
      confetti({ particleCount: 120, spread: 70 })
    } else {
      nextScorePct = Math.round(baseScorePct / 2)
      setGambleSuccess(false)
      playError()
    }
    
    setScore(Math.round((nextScorePct / 100) * questions.length))

    try {
      await fetch('/api/quiz/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id || user?.googleId || 'mock',
          userName: user?.name || 'Anonymous Champion',
          score: nextScorePct,
          xpGained: nextScorePct
        })
      })
      fetchLeaderboard()
    } catch (err) {
      console.warn('Gamble score submit failed:', err)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden bg-[#070a13] text-white">
      <VideoBackground
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_133010_cb9c806d-bc9d-47f1-ac4c-b1759134ec8b.mp4"
        overlay="dark"
        kenBurns={true}
        grain={true}
      />
      <div className="absolute inset-0 bg-animated-grid opacity-5 pointer-events-none z-[3]" />

      <div className="max-w-[95%] lg:px-12 mx-auto relative z-10">
        
        <div className="mb-10 text-center md:text-left">
          <span className="label-overline mb-2 inline-block">Science Competence</span>
          <h1 className="text-4xl lg:text-5xl font-light font-display">
            Climate Champion <span className="gradient-text">Quiz</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mt-1">
            Audit your ecological science expertise, claim experience points, earn badges, and compete on the global leaderboard.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          <div className="xl:col-span-7">
            <motion.div
              className="glass-strong rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl relative min-h-[450px] flex flex-col justify-between"
            >
              <div className="absolute -top-10 left-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none" />

              {!quizStarted ? (

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Trophy className="text-yellow-400" />
                    <h2 className="text-xl font-display text-white">Climate Challenge Portal</h2>
                  </div>

                  <p className="text-xs text-gray-400 leading-normal">
                    Select a scientific domain category and difficulty tier to begin, or challenge yourself in the daily seeded puzzle.
                  </p>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Select Category Domain</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All Domains' },
                        { id: 'renewable-energy', label: 'Renewable Energy' },
                        { id: 'climate-science', label: 'Climate Science' },
                        { id: 'policy', label: 'Environmental Policy' },
                        { id: 'ecosystems', label: 'Ecosystem Ecology' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => { playTap(); setSelectedCategory(cat.id) }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-all ${
                            selectedCategory === cat.id
                              ? 'bg-yellow-500/10 border-yellow-400 text-yellow-400 shadow-md shadow-yellow-500/5'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Select Difficulty Tier</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All Levels' },
                        { id: 'easy', label: 'Easy' },
                        { id: 'medium', label: 'Medium' },
                        { id: 'hard', label: 'Hard' }
                      ].map(diff => (
                        <button
                          key={diff.id}
                          onClick={() => { playTap(); setSelectedDifficulty(diff.id) }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-all ${
                            selectedDifficulty === diff.id
                              ? 'bg-yellow-500/10 border-yellow-400 text-yellow-400 shadow-md shadow-yellow-500/5'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-400'
                          }`}
                        >
                          {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                    <button
                      onClick={startNormalQuiz}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-[#070a13] font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-yellow-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play size={14} fill="currentColor" />
                      Start Standard Quiz
                    </button>

                    <button
                      onClick={startDailyChallenge}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs uppercase tracking-wider rounded-2xl transition-all"
                    >
                      <Calendar size={14} />
                      Daily Challenge 📅
                    </button>
                  </div>
                </div>
              ) : loadingQuestions ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 text-xs font-mono text-gray-500">
                  <Loader2 size={16} className="animate-spin text-yellow-400" />
                  <span>Configuring environmental telemetry...</span>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {!completed ? (
                    <motion.div
                      key="question"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-between items-center text-xs font-mono text-gray-500 border-b border-white/5 pb-4 gap-4 flex-wrap">
                        <span>QUESTION {activeQuestion + 1} OF {questions.length}</span>
                        
                        {streak >= 2 && (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full text-[10px] font-mono font-bold quiz-streak-fire uppercase">
                            🔥 {streak} STREAK COMBO ({Math.min(4, Math.floor(streak / 2) + 1)}x XP)
                          </div>
                        )}

                        <span className="text-yellow-400 font-semibold">{Math.round((score / questions.length) * 100)} POINTS</span>
                      </div>

                      {!answered && !completed && (
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-neon-blue to-neon-pink transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,212,255,0.4)]"
                            style={{ width: `${(timeLeft / 15) * 100}%` }}
                          />
                        </div>
                      )}

                      <h3 className="text-lg md:text-xl font-normal leading-snug font-display text-white">
                        {questions[activeQuestion].question}
                      </h3>

                      <div className="space-y-3">
                        {questions[activeQuestion].options.map((opt, idx) => {
                          const isSelected = selectedOption === idx
                          const isCorrect = questions[activeQuestion].answer === idx
                          let style = 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                          
                          if (answered) {
                            if (isCorrect) style = 'bg-emerald-500/10 border-emerald-400 text-emerald-400'
                            else if (isSelected) style = 'bg-red-500/10 border-red-400 text-red-400'
                            else style = 'bg-white/5 border-white/5 text-gray-500 opacity-50'
                          } else if (isSelected) {
                            style = 'bg-yellow-500/10 border-yellow-400 text-yellow-400'
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleOptionSelect(idx)}
                              disabled={answered}
                              className={`w-full p-4 rounded-xl border text-left text-xs font-mono transition-all duration-200 flex items-center justify-between gap-4 ${style}`}
                            >
                              <span>{opt}</span>
                              {answered && isCorrect && <span className="text-[10px] uppercase font-bold text-emerald-400">[ CORRECT ]</span>}
                              {answered && isSelected && !isCorrect && <span className="text-[10px] uppercase font-bold text-red-400">[ INCORRECT ]</span>}
                            </button>
                          )
                        })}
                      </div>

                      {answered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-400 leading-normal"
                        >
                          <strong>Explanation:</strong> {questions[activeQuestion].expl}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6 text-center py-6 flex flex-col justify-center items-center"
                    >
                      <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 animate-pulse mb-2">
                        <Award size={32} />
                      </div>

                      <div>
                        <span className="text-xs font-mono text-yellow-400 uppercase tracking-widest block">CHALLENGE COMPLETED</span>
                        <h2 className="text-3xl font-display text-white mt-1">Quiz Score: {Math.round((score / questions.length) * 100)}%</h2>
                        <p className="text-gray-400 text-xs mt-2 font-mono">{Math.round((score / questions.length) * 100)} XP gained and awarded to profile.</p>
                      </div>

                      {score === questions.length && !gamblePlayed && (
                        <div className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono uppercase font-semibold">
                          <Sparkles size={14} />
                          <span>Unlocked Climate Scholar</span>
                        </div>
                      )}

                      {!gamblePlayed ? (
                        <div className="mt-8 pt-6 border-t border-white/5 w-full max-w-md text-center">
                          <span className="text-[9px] font-mono text-neon-purple uppercase tracking-widest block mb-2">[ PLATFORM MINI-GAME ]</span>
                          <h4 className="text-white text-base font-display">Quantum XP Double-or-Nothing</h4>
                          <p className="text-gray-400 text-xs mt-1 mb-4 leading-normal max-w-xs mx-auto">
                            Gamble your **{Math.round((score / questions.length) * 100)} XP** on a quantum probability choice card (50% double, 50% lose half).
                          </p>
                          <div className="flex gap-4 justify-center mt-3">
                            <button
                              onClick={() => triggerGamble('SPIN_UP')}
                              onMouseEnter={playHover}
                              className="px-4 py-2 bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan rounded-xl text-xs font-mono transition-all font-bold"
                            >
                              SPIN UP (50%)
                            </button>
                            <button
                              onClick={() => triggerGamble('SPIN_DOWN')}
                              onMouseEnter={playHover}
                              className="px-4 py-2 bg-neon-pink/15 hover:bg-neon-pink/25 border border-neon-pink/30 text-neon-pink rounded-xl text-xs font-mono transition-all font-bold"
                            >
                              SPIN DOWN (50%)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ rotateY: 90, scale: 0.95 }}
                          animate={{ rotateY: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 100, damping: 10 }}
                          className="mt-8 pt-6 border-t border-white/5 w-full max-w-sm text-center"
                        >
                          {gambleSuccess ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-lg">
                              <Sparkles className="mx-auto mb-2 text-emerald-400 animate-bounce" size={20} />
                              <h4 className="text-sm font-display font-semibold">QUANTUM ALIGNMENT SUCCESS!</h4>
                              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                                Your choice aligned perfectly! Your XP has been doubled to **{Math.round((score / questions.length) * 100)} XP**!
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl shadow-lg">
                              <Award className="mx-auto mb-2 text-red-400 animate-pulse" size={20} />
                              <h4 className="text-sm font-display font-semibold">QUANTUM COLLAPSE FAILURE!</h4>
                              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                                The wave collapsed incorrectly. Gained score reduced to **{Math.round((score / questions.length) * 100)} XP**.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      <button
                        onClick={restartQuiz}
                        onMouseEnter={playHover}
                        className="inline-flex items-center gap-2 text-xs font-mono text-neon-blue hover:text-white transition-colors border border-neon-blue/20 bg-neon-blue/5 px-4 py-2.5 rounded-xl mt-6"
                      >
                        <RefreshCw size={12} />
                        <span>RETURN TO HUB</span>
                      </button>

                      <div className="mt-8 pt-6 border-t border-white/5 text-left w-full max-w-sm mx-auto">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-4 text-center">Share Your Ecological Mastery</span>
                        <ShareCard
                          type="quiz"
                          value={`${Math.round((score / questions.length) * 100)}%`}
                          label={isDailyChallenge ? "Daily deterministic climate challenge score" : `Category: ${selectedCategory.toUpperCase()} Quiz`}
                          userName={user?.name || "Eco Scholar"}
                          badge={score === questions.length ? "Quiz Champion" : undefined}
                          extraLines={[
                            `Correct Answers: ${score}/${questions.length}`,
                            `Challenge Mode: ${isDailyChallenge ? 'Daily seeded challenge' : 'Standard filter mode'}`
                          ]}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {!completed && !loadingQuestions && (
                <div className="flex justify-end border-t border-white/5 pt-6 mt-6">
                  {!answered ? (
                    <button
                      type="button"
                      disabled={selectedOption === null}
                      onClick={handleLockAnswer}
                      className="flex items-center gap-2 text-xs font-mono text-yellow-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <span>LOCK ANSWER</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="flex items-center gap-2 text-xs font-mono text-neon-cyan hover:text-white transition-all bg-neon-cyan/5 border border-neon-cyan/20 px-4 py-2 rounded-xl"
                    >
                      <span>{activeQuestion === questions.length - 1 ? 'FINISH' : 'NEXT'}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          <div className="xl:col-span-5">
            <div className="glass-strong rounded-3xl p-6 border border-white/5 shadow-2xl relative space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <Trophy size={18} className="text-yellow-400 animate-bounce" />
                <h3 className="text-lg text-white font-normal font-display">Global Standings</h3>
              </div>

              {loadingLeaderboard ? (
                <div className="py-12 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-yellow-400" />
                  <span>Loading scoreboard registry...</span>
                </div>
              ) : errorLeaderboard ? (
                <div className="py-12 text-center text-red-400 text-xs font-mono border border-red-500/10 bg-red-500/5 rounded-2xl">
                  {errorLeaderboard}
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((item, index) => {
                    const isCurrentUser = user?.name === item.userName
                    const rank = index + 1
                    let rankStyle = 'text-gray-400 bg-white/5 border-white/5'
                    
                    if (rank === 1) rankStyle = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                    else if (rank === 2) rankStyle = 'text-slate-300 bg-slate-300/10 border-slate-300/20'
                    else if (rank === 3) rankStyle = 'text-amber-600 bg-amber-600/10 border-amber-600/20'

                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                          isCurrentUser 
                            ? 'bg-neon-blue/10 border-neon-blue shadow-lg shadow-neon-blue/5' 
                            : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg border flex items-center justify-center font-mono text-xs font-bold ${rankStyle}`}>
                            {rank}
                          </span>
                          <span className={`text-xs truncate ${isCurrentUser ? 'text-neon-cyan font-bold' : 'text-gray-300'}`}>
                            {item.userName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0 text-right font-mono">
                          <div className="text-[10px] text-gray-500">
                            <span>Score: {item.score}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-yellow-400 text-xs font-semibold">
                            <Star size={10} fill="currentColor" />
                            <span>{item.xpGained} XP</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
