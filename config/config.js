// ============================================
// FILE: config/config.js (UPDATED WITH PRICING)
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
    queueCheckInterval: 2500, // Cek queue setiap 5 detik
    orderPrefix: 'KRK'
  },

  // Pricing (dalam Rupiah)
  pricing: {
    pengiriman: 7000,  // Rp 7.000
    ojek: 10000        // Rp 10.000
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