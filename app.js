// ============================================
// FILE: app.js (SIMPLIFIED - NO DATABASE)
// ============================================

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const storage = require('./storage/inMemoryStorage');

// Services
const NotificationService = require('./services/notificationService');
const MessageHandler = require('./handlers/messageHandler');

class KurirBot {
  constructor() {
    this.client = null;
    this.messageHandler = null;
    this.notificationService = null;
  }

  async initialize() {
    console.log('🚀 Initializing Kurir Kan Bot (In-Memory Mode)...');

    // Load saved data if exists
    try {
      storage.loadFromFile();
    } catch (error) {
      console.log('⚠️ Starting with fresh data');
    }

    // Initialize WhatsApp client
    this.initializeClient();
    this.setupEventHandlers();

    // Setup auto-save every 5 minutes
    this.setupAutoSave();

    // Setup daily cleanup
    this.setupDailyCleanup();
  }

  initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'kurir-kan-bot'
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    console.log('✅ WhatsApp client initialized');
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('📱 Scan QR Code:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', async () => {
      console.log('✅ Bot is ready!');
      console.log('📞 Connected as:', this.client.info.pushname);

      this.notificationService = new NotificationService(this.client);
      this.messageHandler = new MessageHandler(this.client, this.notificationService);

      this.startQueueProcessor();

      console.log('🎉 Kurir Kan Bot is now running!');
      this.showStats();
    });

    this.client.on('message', async (message) => {
      try {
        await this.messageHandler.handleMessage(message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Client disconnected:', reason);
      // Save data before exit
      storage.saveToFile();
    });

    console.log('🔄 Starting WhatsApp client...');
    this.client.initialize();
  }

  startQueueProcessor() {
    setInterval(async () => {
      try {
        await this.messageHandler.processQueue();
      } catch (error) {
        console.error('Error processing queue:', error);
      }
    }, 5000);

    console.log('✅ Queue processor started');
  }

  setupAutoSave() {
    // Auto-save every 5 minutes
    setInterval(() => {
      try {
        storage.saveToFile();
        console.log('💾 Auto-saved data');
      } catch (error) {
        console.error('Error auto-saving:', error);
      }
    }, 5 * 60 * 1000);

    console.log('✅ Auto-save enabled (every 5 minutes)');
  }

  setupDailyCleanup() {
    // Cleanup old orders every day at 3 AM
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // tomorrow
      3, 0, 0 // 3 AM
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
      this.runDailyCleanup();
      // Then repeat every 24 hours
      setInterval(() => this.runDailyCleanup(), 24 * 60 * 60 * 1000);
    }, msToMidnight);

    console.log('✅ Daily cleanup scheduled');
  }

  runDailyCleanup() {
    console.log('🧹 Running daily cleanup...');
    
    // Reset driver daily stats
    storage.resetDailyStats();
    
    // Clean old orders (keep 30 days)
    const deletedCount = storage.cleanupOldOrders(30);
    console.log(`🗑️ Deleted ${deletedCount} old orders`);
    
    // Save after cleanup
    storage.saveToFile();
  }

  showStats() {
    const stats = storage.getDailyStats();
    console.log('\n📊 STATISTIK HARI INI:');
    console.log(`Total Drivers: ${storage.getAllDrivers().length}`);
    console.log(`Total Orders: ${stats.totalOrders}`);
    console.log(`Completed: ${stats.completedOrders}`);
    console.log(`Active: ${stats.activeOrders}`);
    console.log(`Queue: ${storage.getQueueSize()}\n`);
  }

  async shutdown() {
    console.log('🛑 Shutting down bot...');
    
    // Save data
    storage.saveToFile();
    
    if (this.client) {
      await this.client.destroy();
    }

    console.log('👋 Bot shutdown complete');
    process.exit(0);
  }
}

// Initialize bot
const bot = new KurirBot();
bot.initialize();

// Handle shutdown signals
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  storage.saveToFile(); // Emergency save
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

module.exports = bot;