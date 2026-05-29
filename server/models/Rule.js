const mongoose = require('mongoose')

const RuleSchema = new mongoose.Schema({
  userId: {
    type: String, // String to handle both MongoDB ObjectId and Mock User IDs seamlessly
    required: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  metric: {
    type: String,
    enum: ['temp', 'wind', 'uv', 'aqi'],
    required: true
  },
  condition: {
    type: String,
    enum: ['greater', 'less'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Rule', RuleSchema)
