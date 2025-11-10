// ============================================
// FILE: config/config.js
// ============================================

module.exports = {
  // Bot Configuration
  bot: {
    sessionName: 'kurir-kan-bot',
    autoReconnect: true,
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },

  // Business Logic
  order: {
    timeout: 60000, // 60 detik untuk driver response
    queueCheckInterval: 5000, // Cek queue setiap 5 detik
    orderPrefix: 'KRK'
  },

  // Groups & Numbers
  groups: {
    driverGroupId: null // Will be set dynamically
  },

  // Database (example using MongoDB)
  database: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/kurir-kan'
  }
};