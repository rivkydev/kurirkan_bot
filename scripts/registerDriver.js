// ============================================
// FILE: scripts/registerDriver.js (SIMPLIFIED)
// ============================================

const storage = require('../storage/inMemoryStorage');

async function registerDriver(driverId, name, phone) {
  try {
    // Load existing data
    storage.loadFromFile();

    // Add driver
    const driver = storage.addDriver(driverId, name, phone);
    
    console.log(`✅ Driver ${name} berhasil didaftarkan!`);
    console.log(`Driver ID: ${driverId}`);
    console.log(`Phone: ${phone}`);

    // Save to file
    storage.saveToFile();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const [driverId, name, phone] = process.argv.slice(2);

if (!driverId || !name || !phone) {
  console.log('Usage: node scripts/registerDriver.js <driverId> "<name>" "<phone>"');
  console.log('Example: node scripts/registerDriver.js DRV001 "John Doe" "081234567890"');
  process.exit(1);
}

registerDriver(driverId, name, phone);