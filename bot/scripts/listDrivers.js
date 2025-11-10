// ============================================
// FILE: scripts/listDrivers.js
// ============================================

// Script untuk melihat daftar driver
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const config = require('../config/config');

async function listDrivers() {
  try {
    await mongoose.connect(config.database.url);

    const drivers = await Driver.find().sort({ name: 1 });

    console.log('\n📋 DAFTAR DRIVER:\n');
    console.log('ID'.padEnd(10), 'Nama'.padEnd(20), 'Phone'.padEnd(15), 'Status'.padEnd(12), 'Orders');
    console.log('-'.repeat(70));

    drivers.forEach(d => {
      console.log(
        d.driverId.padEnd(10),
        d.name.padEnd(20),
        d.phone.padEnd(15),
        d.status.padEnd(12),
        `${d.todayOrders}/${d.totalOrders}`
      );
    });

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listDrivers();