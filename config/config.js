// ============================================
// FILE: config/config.js - WITH ADMIN
// ============================================

module.exports = {
  // Bot Configuration
  bot: {
    sessionName: process.env.BOT_SESSION_NAME || 'kurir-kan-bot',
    autoReconnect: true,
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },

  // Business Logic
  order: {
    timeout: parseInt(process.env.ORDER_TIMEOUT) || 60000, // 60 detik untuk driver response
    queueCheckInterval: parseInt(process.env.QUEUE_CHECK_INTERVAL) || 5000, // Cek queue setiap 5 detik
    orderPrefix: process.env.ORDER_PREFIX || 'KRK'
  },

  // Admin Configuration
  admin: {
    phone: '6285823358559', // Nomor admin yang bisa akses analytics & reports
    allowedNumbers: ['6285823358559'], // Bisa ditambahkan lebih banyak admin
  },

  // Groups & Numbers
  groups: {
    driverGroupId: null // Will be set dynamically
  },

  // Database
  database: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/kurir-kan'
  },

  // Feature Flags
  features: {
    showDriverInfoOnWelcome: true, // Tampilkan info driver saat welcome
    allowRepeatOrders: true, // Customer bisa order lagi
    showEstimatedTime: true // Tampilkan estimasi waktu
  }
};