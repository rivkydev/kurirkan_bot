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
      _id: result.queueItem.orderNumber,
      order: result.order
    };
  }

  removeFromQueue(orderNumber) {
    storage.removeFromQueue(orderNumber);
  }

  getQueueSize() {
    return storage.getQueueSize();
  }

  getAllQueue() {
    return storage.queue.map(item => ({
      order: storage.getOrder(item.orderNumber)
    }));
  }
}

module.exports = new QueueService();