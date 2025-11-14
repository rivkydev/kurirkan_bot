// ============================================
// FILE: scripts/updateDriverLID.js
// Script untuk update LID driver yang sudah terdaftar
// ============================================

const storage = require('../storage/inMemoryStorage');

async function updateDriverLID(driverId, lid) {
  try {
    // Load existing data
    storage.loadFromFile();

    // Get driver
    const driver = storage.getDriver(driverId);
    if (!driver) {
      console.error(`❌ Driver ${driverId} tidak ditemukan`);
      process.exit(1);
    }

    // Normalize LID
    const normalizedLID = lid.replace('@lid', '').replace('@c.us', '').replace('@s.whatsapp.net', '').replace(/[\s-]/g, '');

    // Update driver LID
    driver.lid = normalizedLID;
    
    // Update index
    storage.driversByLID.set(normalizedLID, driverId);

    console.log(`✅ Driver ${driver.name} (${driverId}) updated!`);
    console.log(`   Phone: ${driver.phone}`);
    console.log(`   LID: ${normalizedLID}`);

    // Save to file
    storage.saveToFile();

    console.log('\n✅ Data saved successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const [driverId, lid] = process.argv.slice(2);

if (!driverId || !lid) {
  console.log('Usage: node scripts/updateDriverLID.js <driverId> <LID>');
  console.log('Example: node scripts/updateDriverLID.js DRV001 "8637615485122"');
  console.log('\nTips:');
  console.log('- Gunakan script detectLID.js untuk mendapatkan LID driver');
  console.log('- LID format: angka 13 digit (tanpa @lid)');
  process.exit(1);
}

updateDriverLID(driverId, lid);