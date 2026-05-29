const mongoose = require('mongoose')

const ScoreSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  xpGained: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

module.exports = mongoose.model('Score', ScoreSchema)
