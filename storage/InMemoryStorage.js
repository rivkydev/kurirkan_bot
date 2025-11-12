// ============================================
// FILE: storage/inMemoryStorage.js (FIXED PRIORITY)
// ============================================

class InMemoryStorage {
  constructor() {
    // Data stores
    this.drivers = new Map(); // driverId -> driver object
    this.orders = new Map();  // orderNumber -> order object
    this.queue = [];          // Array of order objects
    this.userStates = new Map(); // chatId -> user state
    
    // Indexes untuk query cepat
    this.driversByPhone = new Map(); // phone -> driverId
    this.ordersByCustomer = new Map(); // phone -> [orderNumbers]
    this.activeOrders = new Set(); // Set of active orderNumbers
    
    // Counters
    this.orderCounter = 0;
    this.driverCounter = 0;
  }

  // ========== DRIVER METHODS ==========
  
  addDriver(driverId, name, phone) {
    const driver = {
      driverId,
      name,
      phone: phone.replace(/[\s-]/g, ''),
      status: 'Off Duty',
      currentOrder: null,
      totalOrders: 0,
      todayOrders: 0,
      lastStatusUpdate: new Date(),
      createdAt: new Date()
    };

    this.drivers.set(driverId, driver);
    this.driversByPhone.set(driver.phone, driverId);
    
    return driver;
  }

  getDriver(driverId) {
    return this.drivers.get(driverId);
  }

  getDriverByPhone(phone) {
    const normalizedPhone = phone.replace('@c.us', '').replace('@lid', '').replace(/[\s-]/g, '');
    const driverId = this.driversByPhone.get(normalizedPhone);
    return driverId ? this.drivers.get(driverId) : null;
  }

  getAllDrivers() {
    return Array.from(this.drivers.values());
  }

  updateDriverStatus(driverId, status) {
    const driver = this.drivers.get(driverId);
    if (!driver) throw new Error('Driver not found');

    driver.status = status;
    driver.lastStatusUpdate = new Date();
    
    return driver;
  }

  assignOrderToDriver(driverId, orderNumber) {
    const driver = this.drivers.get(driverId);
    if (!driver) throw new Error('Driver not found');

    driver.status = 'Busy';
    driver.currentOrder = orderNumber;
    driver.totalOrders += 1;
    driver.todayOrders += 1;
    
    return driver;
  }

  releaseDriver(driverId) {
    const driver = this.drivers.get(driverId);
    if (!driver) throw new Error('Driver not found');

    driver.status = 'On Duty';
    driver.currentOrder = null;
    
    return driver;
  }

  // FIXED: Prioritize driver with LEAST orders today
  getAvailableDrivers() {
    const available = Array.from(this.drivers.values())
      .filter(d => d.status === 'On Duty' && !d.currentOrder);
    
    // Sort by todayOrders ASC (paling sedikit orderan di prioritaskan)
    available.sort((a, b) => {
      // Primary: Sort by todayOrders (ascending - least orders first)
      if (a.todayOrders !== b.todayOrders) {
        return a.todayOrders - b.todayOrders;
      }
      // Secondary: If same orders, sort by totalOrders (ascending)
      if (a.totalOrders !== b.totalOrders) {
        return a.totalOrders - b.totalOrders;
      }
      // Tertiary: Random to be fair
      return Math.random() - 0.5;
    });
    
    return available;
  }

  resetDailyStats() {
    const today = new Date().setHours(0, 0, 0, 0);
    
    for (const driver of this.drivers.values()) {
      const lastUpdate = new Date(driver.lastStatusUpdate).setHours(0, 0, 0, 0);
      if (today > lastUpdate) {
        driver.todayOrders = 0;
      }
    }
  }

  // ========== ORDER METHODS ==========
  
  generateOrderNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    this.orderCounter += 1;
    const sequence = String(this.orderCounter).padStart(3, '0');
    return `KRK-${dateStr}-${sequence}`;
  }

  createOrder(orderType, customerData, orderData) {
    const orderNumber = this.generateOrderNumber();
    
    const order = {
      orderNumber,
      orderType,
      status: 'NEW',
      customer: customerData,
      assignedDriver: null,
      assignedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      timeline: [
        { status: 'NEW', timestamp: new Date(), note: 'Order created' }
      ],
      createdAt: new Date()
    };

    // Set order-specific data
    if (orderType === 'Pengiriman') {
      order.pengiriman = orderData;
    } else if (orderType === 'Ojek') {
      order.ojek = orderData;
    }

    this.orders.set(orderNumber, order);
    this.activeOrders.add(orderNumber);
    
    // Index by customer
    const customerOrders = this.ordersByCustomer.get(customerData.phone) || [];
    customerOrders.push(orderNumber);
    this.ordersByCustomer.set(customerData.phone, customerOrders);

    return order;
  }

  getOrder(orderNumber) {
    return this.orders.get(orderNumber);
  }

  getOrdersByCustomer(customerPhone) {
    const orderNumbers = this.ordersByCustomer.get(customerPhone) || [];
    return orderNumbers.map(num => this.orders.get(num)).filter(Boolean);
  }

  getActiveOrders() {
    return Array.from(this.activeOrders)
      .map(num => this.orders.get(num))
      .filter(Boolean);
  }

  updateOrderStatus(orderNumber, status, note = '') {
    const order = this.orders.get(orderNumber);
    if (!order) throw new Error('Order not found');

    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note
    });

    if (status === 'DELIVERED') {
      order.completedAt = new Date();
      this.activeOrders.delete(orderNumber);
    } else if (status === 'CANCELLED') {
      order.cancelledAt = new Date();
      this.activeOrders.delete(orderNumber);
    }

    return order;
  }

  assignDriver(orderNumber, driverId) {
    const order = this.orders.get(orderNumber);
    if (!order) throw new Error('Order not found');

    order.assignedDriver = driverId;
    order.status = 'ASSIGNED';
    order.assignedAt = new Date();
    order.timeline.push({
      status: 'ASSIGNED',
      timestamp: new Date(),
      note: `Assigned to driver ${driverId}`
    });

    return order;
  }

  cancelOrder(orderNumber, reason) {
    const order = this.orders.get(orderNumber);
    if (!order) throw new Error('Order not found');

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.timeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: reason
    });

    this.activeOrders.delete(orderNumber);

    return order;
  }

  // ========== QUEUE METHODS ==========
  
  addToQueue(orderNumber) {
    const order = this.orders.get(orderNumber);
    if (!order) throw new Error('Order not found');

    this.queue.push({
      orderNumber,
      addedAt: new Date(),
      attempts: 0
    });

    return true;
  }

  getNextInQueue() {
    if (this.queue.length === 0) return null;
    
    const queueItem = this.queue[0];
    const order = this.orders.get(queueItem.orderNumber);
    
    return { queueItem, order };
  }

  removeFromQueue(orderNumber) {
    this.queue = this.queue.filter(item => item.orderNumber !== orderNumber);
  }

  getQueueSize() {
    return this.queue.length;
  }

  // ========== ANALYTICS METHODS ==========
  
  getDailyStats(date = new Date()) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const ordersToday = Array.from(this.orders.values())
      .filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay);

    const totalOrders = ordersToday.length;
    const completedOrders = ordersToday.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = ordersToday.filter(o => o.status === 'CANCELLED').length;
    const activeOrders = this.activeOrders.size;

    // Calculate avg completion time
    const completedWithTime = ordersToday.filter(o => 
      o.status === 'DELIVERED' && o.completedAt && o.createdAt
    );
    
    let avgCompletionTime = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, o) => 
        sum + (o.completedAt - o.createdAt), 0
      );
      avgCompletionTime = Math.round((totalTime / completedWithTime.length) / 60000); // minutes
    }

    return {
      date: startOfDay,
      totalOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      avgCompletionTime,
      completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0
    };
  }

  // ========== CLEANUP METHODS ==========
  
  cleanupOldOrders(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;
    
    for (const [orderNumber, order] of this.orders.entries()) {
      if (
        (order.status === 'DELIVERED' || order.status === 'CANCELLED') &&
        order.createdAt < cutoffDate
      ) {
        this.orders.delete(orderNumber);
        this.activeOrders.delete(orderNumber);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // ========== PERSISTENCE (OPTIONAL) ==========
  
  exportData() {
    return {
      drivers: Array.from(this.drivers.entries()),
      orders: Array.from(this.orders.entries()),
      queue: this.queue,
      orderCounter: this.orderCounter,
      exportedAt: new Date()
    };
  }

  importData(data) {
    if (data.drivers) {
      this.drivers = new Map(data.drivers);
      // Rebuild indexes
      this.driversByPhone.clear();
      for (const [driverId, driver] of this.drivers) {
        this.driversByPhone.set(driver.phone, driverId);
      }
    }

    if (data.orders) {
      this.orders = new Map(data.orders);
      // Rebuild indexes
      this.ordersByCustomer.clear();
      this.activeOrders.clear();
      
      for (const [orderNumber, order] of this.orders) {
        // Customer index
        const customerOrders = this.ordersByCustomer.get(order.customer.phone) || [];
        customerOrders.push(orderNumber);
        this.ordersByCustomer.set(order.customer.phone, customerOrders);
        
        // Active orders
        if (['NEW', 'AWAITING_DRIVER', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)) {
          this.activeOrders.add(orderNumber);
        }
      }
    }

    if (data.queue) {
      this.queue = data.queue;
    }

    if (data.orderCounter) {
      this.orderCounter = data.orderCounter;
    }

    return true;
  }

  // Save to JSON file (optional persistence)
  saveToFile(filepath = './data/storage.json') {
    const fs = require('fs');
    const path = require('path');
    
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = this.exportData();
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Data saved to ${filepath}`);
    return true;
  }

  loadFromFile(filepath = './data/storage.json') {
    const fs = require('fs');
    
    if (!fs.existsSync(filepath)) {
      console.log('⚠️ No saved data file found');
      return false;
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    this.importData(data);
    
    console.log(`✅ Data loaded from ${filepath}`);
    return true;
  }
}

// Singleton instance
const storage = new InMemoryStorage();

module.exports = storage;