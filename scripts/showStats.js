// ============================================
// FILE: scripts/showStats.js (NEW)
// ============================================

const storage = require('../storage/inMemoryStorage');

function showStats() {
  try {
    storage.loadFromFile();

    const stats = storage.getDailyStats();
    const drivers = storage.getAllDrivers();
    const activeOrders = storage.getActiveOrders();

    console.log('\n📊 STATISTIK KURIR KAN BOT\n');
    console.log('='.repeat(50));
    
    console.log('\n👨‍💼 DRIVER:');
    console.log(`Total: ${drivers.length}`);
    console.log(`On Duty: ${drivers.filter(d => d.status === 'On Duty').length}`);
    console.log(`Busy: ${drivers.filter(d => d.status === 'Busy').length}`);
    console.log(`Off Duty: ${drivers.filter(d => d.status === 'Off Duty').length}`);

    console.log('\n📦 ORDERAN HARI INI:');
    console.log(`Total: ${stats.totalOrders}`);
    console.log(`Selesai: ${stats.completedOrders}`);
    console.log(`Dibatalkan: ${stats.cancelledOrders}`);
    console.log(`Success Rate: ${stats.completionRate}%`);
    console.log(`Avg Time: ${stats.avgCompletionTime} menit`);

    console.log('\n⚡ REAL-TIME:');
    console.log(`Active Orders: ${stats.activeOrders}`);
    console.log(`Queue: ${storage.getQueueSize()}`);

    console.log('\n' + '='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showStats();