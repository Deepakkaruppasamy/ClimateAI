const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    default: () => `local-google-${Date.now()}-${Math.random().toString(36).slice(2)}`
  },
  clerkId: {
    type: String,
    default: () => `local-clerk-${Date.now()}-${Math.random().toString(36).slice(2)}`
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  quizStats: {
    streak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    completed: { type: Number, default: 0 }
  },
  badges: {
    type: [String],
    default: []
  },
  footprint: {
    type: Number,
    default: 0
  },
  footprintHistory: {
    type: [{
      value: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }],
    default: []
  },
  bio: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pushSubscriptions: {
    type: Array,
    default: []
  }
})

module.exports = mongoose.model('User', UserSchema)

