// ============================================
// FILE: models/Driver.js
// ============================================

const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['On Duty', 'Off Duty', 'Busy'],
    default: 'Off Duty'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  todayOrders: {
    type: Number,
    default: 0
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Reset todayOrders setiap hari
driverSchema.methods.resetDailyStats = function() {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastUpdate = new Date(this.lastStatusUpdate).setHours(0, 0, 0, 0);
  
  if (today > lastUpdate) {
    this.todayOrders = 0;
  }
};

module.exports = mongoose.model('Driver', driverSchema);