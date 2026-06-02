const mongoose = require('mongoose');

const CarbonRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, 
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  projectId: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CarbonRequest', CarbonRequestSchema);
