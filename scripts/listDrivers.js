// ============================================
// FILE: scripts/listDrivers.js (SIMPLIFIED)
// ============================================

const storage = require('../storage/inMemoryStorage');

async function listDrivers() {
  try {
    storage.loadFromFile();

    const drivers = storage.getAllDrivers();

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