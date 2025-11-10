// ============================================
// FILE: models/Queue.js (FIXED)
// ============================================

const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  priority: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Queue', queueSchema);