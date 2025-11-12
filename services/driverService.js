// ============================================
// FILE: services/driverService.js (FIXED)
// ============================================

const storage = require('../storage/inMemoryStorage');

class DriverService {
  updateDriverStatus(phone, status) {
    // Jangan normalize, gunakan phone asli
    const normalizedPhone = phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
    
    const driver = storage.getDriverByPhone(normalizedPhone);
    if (!driver) {
      throw new Error('Driver tidak terdaftar');
    }

    if (status === 'On Duty' && driver.currentOrder) {
      throw new Error('Selesaikan orderan saat ini terlebih dahulu');
    }

    storage.updateDriverStatus(driver.driverId, status);
    return driver;
  }

  getAvailableDrivers() {
    return storage.getAvailableDrivers();
  }

  assignOrder(driverId, orderNumber) {
    return storage.assignOrderToDriver(driverId, orderNumber);
  }

  releaseDriver(driverId) {
    return storage.releaseDriver(driverId);
  }

  getDriverByPhone(phone) {
    // Normalize phone - remove semua suffix
    const normalizedPhone = phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
    return storage.getDriverByPhone(normalizedPhone);
  }

  getAllDriversStatus() {
    const drivers = storage.getAllDrivers();
    return drivers.map(d => ({
      name: d.name,
      status: d.status,
      todayOrders: d.todayOrders,
      currentOrder: d.currentOrder || '-'
    }));
  }

  registerDriver(data) {
    return storage.addDriver(data.driverId, data.name, data.phone);
  }
}

module.exports = new DriverService();