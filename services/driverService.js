
// ============================================
// FILE: services/driverService.js (IN-MEMORY)
// ============================================

const storage = require('../storage/inMemoryStorage');

class DriverService {
  updateDriverStatus(phone, status) {
    const driver = storage.getDriverByPhone(phone);
    if (!driver) throw new Error('Driver tidak terdaftar');

    if (status === 'On Duty' && driver.currentOrder) {
      throw new Error('Selesaikan orderan saat ini terlebih dahulu');
    }

    return storage.updateDriverStatus(driver.driverId, status);
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
    return storage.getDriverByPhone(phone);
  }

  getAllDriversStatus() {
    return storage.getAllDrivers().map(d => ({
      name: d.name,
      status: d.status,
      todayOrders: d.todayOrders,
      currentOrder: d.currentOrder || '-'
    }));
  }
}

module.exports = new DriverService();