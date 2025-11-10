// ============================================
// FILE: scripts/cleanup.js
// ============================================

const mongoose = require('mongoose');
const config = require('../config/config');
const Order = require('../models/Order');
const Queue = require('../models/Queue');
const logger = require('../utils/logger');

async function cleanup() {
  try {
    await mongoose.connect(config.database.url);
    logger.info('Running cleanup...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old completed orders
    const deletedOrders = await Order.deleteMany({
      status: { $in: ['DELIVERED', 'CANCELLED'] },
      createdAt: { $lt: thirtyDaysAgo }
    });

    logger.info(`Deleted ${deletedOrders.deletedCount} old orders`);

    // Clean up stuck queue items
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const deletedQueue = await Queue.deleteMany({
      createdAt: { $lt: oneDayAgo }
    });

    logger.info(`Deleted ${deletedQueue.deletedCount} stuck queue items`);

    // Reset daily stats for all drivers at midnight
    const Driver = require('../models/Driver');
    const today = new Date().setHours(0, 0, 0, 0);
    
    const drivers = await Driver.find();
    let resetCount = 0;

    for (const driver of drivers) {
      const lastUpdate = new Date(driver.lastStatusUpdate).setHours(0, 0, 0, 0);
      
      if (today > lastUpdate && driver.todayOrders > 0) {
        driver.todayOrders = 0;
        await driver.save();
        resetCount++;
      }
    }

    logger.info(`Reset daily stats for ${resetCount} drivers`);

    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();