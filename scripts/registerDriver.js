// ============================================
// FILE: scripts/registerDriver.js
// ============================================

// Script untuk mendaftarkan driver baru
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const config = require('../config/config');

async function registerDriver(driverId, name, phone) {
  try {
    await mongoose.connect(config.database.url);

    const driver = new Driver({
      driverId,
      name,
      phone: phone.replace(/[\s-]/g, '')
    });

    await driver.save();
    console.log(`✅ Driver ${name} berhasil didaftarkan!`);
    console.log(`Driver ID: ${driverId}`);
    console.log(`Phone: ${phone}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Usage: node scripts/registerDriver.js DRV001 "John Doe" "081234567890"
const [driverId, name, phone] = process.argv.slice(2);

if (!driverId || !name || !phone) {
  console.log('Usage: node scripts/registerDriver.js <driverId> "<name>" "<phone>"');
  console.log('Example: node scripts/registerDriver.js DRV001 "John Doe" "081234567890"');
  process.exit(1);
}

registerDriver(driverId, name, phone);