// ============================================
// FILE: services/queueService.js (IN-MEMORY)
// ============================================

const storage = require('../storage/inMemoryStorage');

class QueueService {
  addToQueue(orderNumber) {
    return storage.addToQueue(orderNumber);
  }

  getNextOrder() {
    const result = storage.getNextInQueue();
    if (!result) return null;
    
    return {
      _id: result.queueItem.orderNumber, // For compatibility
      order: result.order
    };
  }

  removeFromQueue(queueId) {
    // queueId is actually orderNumber in this case
    return storage.removeFromQueue(queueId);
  }

  getQueueSize() {
    return storage.getQueueSize();
  }
}

module.exports = new QueueService();