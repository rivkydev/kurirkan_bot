// ============================================
// FILE: app.js (MAIN APPLICATION - FIXED)
// ============================================

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const config = require('./config/config');

// Services
const NotificationService = require('./services/notificationService');
const MessageHandler = require('./handlers/messageHandler');

// Models
const Driver = require('./models/Driver');
const Order = require('./models/Order');
const Queue = require('./models/Queue');

class KurirBot {
  constructor() {
    this.client = null;
    this.messageHandler = null;
    this.notificationService = null;
  }

  // Initialize bot
  async initialize() {
    console.log('🚀 Initializing Kurir Kan Bot...');

    // Connect to database
    await this.connectDatabase();

    // Initialize WhatsApp client
    this.initializeClient();

    // Setup event handlers
    this.setupEventHandlers();
  }

  // Connect to MongoDB
  async connectDatabase() {
    try {
      await mongoose.connect(config.database.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  // Initialize WhatsApp client
  initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: config.bot.sessionName
      }),
      puppeteer: config.bot.puppeteerOptions
    });

    console.log('✅ WhatsApp client initialized');
  }

  // Setup event handlers
  setupEventHandlers() {
    // QR Code for authentication
    this.client.on('qr', (qr) => {
      console.log('📱 Scan QR Code di bawah ini:');
      qrcode.generate(qr, { small: true });
    });

    // Ready event
    this.client.on('ready', async () => {
      console.log('✅ Bot is ready!');
      console.log('📞 Connected as:', this.client.info.pushname);

      // Initialize services
      this.notificationService = new NotificationService(this.client);
      this.messageHandler = new MessageHandler(this.client, this.notificationService);

      // Start queue processor
      this.startQueueProcessor();

      console.log('🎉 Kurir Kan Bot is now running!');
    });

    // Message handler
    this.client.on('message', async (message) => {
      try {
        await this.messageHandler.handleMessage(message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Disconnected event
    this.client.on('disconnected', (reason) => {
      console.log('❌ Client was disconnected:', reason);
    });

    // Auth failure
    this.client.on('auth_failure', (message) => {
      console.error('❌ Authentication failure:', message);
    });

    // Start client
    console.log('🔄 Starting WhatsApp client...');
    this.client.initialize();
  }

  // Start queue processor (check queue every 5 seconds)
  startQueueProcessor() {
    setInterval(async () => {
      try {
        await this.messageHandler.processQueue();
      } catch (error) {
        console.error('Error processing queue:', error);
      }
    }, config.order.queueCheckInterval);

    console.log('✅ Queue processor started');
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down bot...');
    
    if (this.client) {
      await this.client.destroy();
    }

    await mongoose.connection.close();
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
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

module.exports = bot;