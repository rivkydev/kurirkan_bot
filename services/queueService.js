// ============================================
// FILE: services/queueService.js
// ============================================

const Queue = require('../models/Queue');
const Order = require('../models/Order');

class QueueService {
  // Add order to queue
  async addToQueue(orderId) {
    const queueItem = new Queue({
      order: orderId,
      priority: 0,
      attempts: 0
    });
    await queueItem.save();
    return queueItem;
  }

  // Get next order from queue
  async getNextOrder() {
    const queueItem = await Queue.findOne()
      .sort({ priority: -1, createdAt: 1 })
      .populate('order');
    
    return queueItem;
  }

  // Remove order from queue
  async removeFromQueue(queueId) {
    await Queue.findByIdAndDelete(queueId);
  }

  // Increment attempts
  async incrementAttempts(queueId) {
    const queueItem = await Queue.findById(queueId);
    if (queueItem) {
      queueItem.attempts += 1;
      await queueItem.save();
    }
    return queueItem;
  }

  // Get queue size
  async getQueueSize() {
    return await Queue.countDocuments();
  }

  // Get all queue items
  async getAllQueue() {
    return await Queue.find()
      .sort({ priority: -1, createdAt: 1 })
      .populate('order');
  }
}

module.exports = new QueueService();