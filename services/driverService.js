// ============================================
// FILE: services/driverService.js
// ============================================

const Driver = require('../models/Driver');

class DriverService {
  // Update status driver
  async updateDriverStatus(phone, status) {
    const normalizedPhone = phone.replace('@c.us', '');
    
    const driver = await Driver.findOne({ phone: normalizedPhone });
    if (!driver) {
      throw new Error('Driver tidak terdaftar');
    }

    // Reset daily stats jika hari baru
    driver.resetDailyStats();

    // Validasi: tidak bisa On Duty jika masih ada orderan
    if (status === 'On Duty' && driver.currentOrder) {
      throw new Error('Selesaikan orderan saat ini terlebih dahulu');
    }

    driver.status = status;
    driver.lastStatusUpdate = new Date();
    await driver.save();

    return driver;
  }

  // Dapatkan driver yang available
  async getAvailableDrivers() {
    return await Driver.find({
      status: 'On Duty',
      currentOrder: null
    }).sort({ todayOrders: 1 }); // Prioritas yang paling sedikit orderan hari ini
  }

  // Assign order ke driver
  async assignOrder(driverId, orderId) {
    const driver = await Driver.findById(driverId);
    if (!driver) throw new Error('Driver not found');

    driver.status = 'Busy';
    driver.currentOrder = orderId;
    driver.totalOrders += 1;
    driver.todayOrders += 1;
    await driver.save();

    return driver;
  }

  // Release driver setelah order selesai
  async releaseDriver(driverId) {
    const driver = await Driver.findById(driverId);
    if (!driver) throw new Error('Driver not found');

    driver.status = 'On Duty';
    driver.currentOrder = null;
    await driver.save();

    return driver;
  }

  // Get driver by phone
  async getDriverByPhone(phone) {
    const normalizedPhone = phone.replace('@c.us', '');
    return await Driver.findOne({ phone: normalizedPhone });
  }

  // Get all drivers with status
  async getAllDriversStatus() {
    const drivers = await Driver.find().sort({ name: 1 });
    return drivers.map(d => ({
      name: d.name,
      status: d.status,
      todayOrders: d.todayOrders,
      currentOrder: d.currentOrder ? 'Ada orderan' : '-'
    }));
  }

  // Register new driver (admin function)
  async registerDriver(data) {
    const driver = new Driver({
      driverId: data.driverId,
      name: data.name,
      phone: data.phone
    });
    await driver.save();
    return driver;
  }
}

module.exports = new DriverService();