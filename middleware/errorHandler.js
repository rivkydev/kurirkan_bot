// ============================================
// FILE: middleware/errorHandler.js
// ============================================

const logger = require('../utils/logger');

class ErrorHandler {
  static async handle(error, context = {}) {
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      context
    });

    // Send notification to admin if critical
    if (this.isCritical(error)) {
      await this.notifyAdmin(error, context);
    }

    return {
      success: false,
      error: error.message
    };
  }

  static isCritical(error) {
    const criticalKeywords = [
      'database',
      'mongodb',
      'connection',
      'auth',
      'whatsapp'
    ];

    return criticalKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  static async notifyAdmin(error, context) {
    // TODO: Implement admin notification
    // Bisa pakai Telegram bot, email, atau WhatsApp
    logger.error('CRITICAL ERROR - Admin notification needed', {
      error: error.message,
      context
    });
  }
}

module.exports = ErrorHandler;