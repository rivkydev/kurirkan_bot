const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

async function backupDatabase() {
  const backupDir = path.join(__dirname, '../backups');
  
  // Create backup directory if not exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/kurir-kan';
  const dbName = mongoUrl.split('/').pop();

  const command = `mongodump --db ${dbName} --out ${backupPath}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error('Backup failed:', error);
        reject(error);
        return;
      }

      logger.info(`Backup created: ${backupPath}`);
      
      // Delete old backups (keep last 7 days)
      cleanOldBackups(backupDir, 7);
      
      resolve(backupPath);
    });
  });
}

function cleanOldBackups(backupDir, daysToKeep) {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      fs.rmSync(filePath, { recursive: true, force: true });
      logger.info(`Deleted old backup: ${file}`);
    }
  });
}

// Run backup
backupDatabase()
  .then(path => {
    console.log(`✅ Backup completed: ${path}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  });