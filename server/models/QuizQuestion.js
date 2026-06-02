const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], default: [] }, 
  answer: { type: String, required: true }, 
  expl: { type: String, default: '' },      
  type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], default: 'multiple-choice' },
  category: {
    type: String,
    enum: ['all', 'renewable-energy', 'climate-science', 'policy', 'ecosystems'],
    default: 'climate-science'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
