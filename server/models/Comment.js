const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
  articleId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

module.exports = mongoose.model('Comment', CommentSchema)
