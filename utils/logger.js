const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    
    // Create logs directory if not exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  getLogFileName(type = 'app') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  writeLog(type, level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      type,
      message,
      data
    };

    const logString = JSON.stringify(logEntry) + '\n';
    
    // Write to file
    const filename = this.getLogFileName(type);
    fs.appendFileSync(filename, logString);

    // Also log to console
    const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (level === 'error') {
      console.error(consoleMsg, data || '');
    } else if (level === 'warn') {
      console.warn(consoleMsg, data || '');
    } else {
      console.log(consoleMsg, data || '');
    }
  }

  info(message, data = null) {
    this.writeLog('app', 'info', message, data);
  }

  error(message, data = null) {
    this.writeLog('app', 'error', message, data);
  }

  warn(message, data = null) {
    this.writeLog('app', 'warn', message, data);
  }

  order(message, data = null) {
    this.writeLog('order', 'info', message, data);
  }

  driver(message, data = null) {
    this.writeLog('driver', 'info', message, data);
  }

  message(message, data = null) {
    this.writeLog('message', 'info', message, data);
  }
}

module.exports = new Logger();