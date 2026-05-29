const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  summary:  { type: String, required: true },
  category: { type: String, default: 'General' },
  date:     { type: String, default: () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
  imageUrl: { type: String, default: '' },
  likes:    { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', ArticleSchema);
