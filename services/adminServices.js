// ============================================
// FILE: services/adminService.js - NEW
// ============================================

const config = require('../config/config');
const analyticsService = require('./analyticsService');
const driverService = require('./driverService');
const orderService = require('./orderService');
const queueService = require('./queueService');
const Formatter = require('../utils/formatter');

class AdminService {
  // Check if user is admin
  isAdmin(phone) {
    const normalizedPhone = phone.replace('@c.us', '').replace(/^0/, '62');
    return config.admin.allowedNumbers.includes(normalizedPhone);
  }

  // Get real-time dashboard
  async getDashboard() {
    const [
      availableDrivers,
      busyDrivers,
      offDutyDrivers,
      activeOrders,
      queueSize,
      todayStats
    ] = await Promise.all([
      driverService.getAvailableDrivers(),
      this.getBusyDrivers(),
      this.getOffDutyDrivers(),
      orderService.getActiveOrdersCount(),
      queueService.getQueueSize(),
      analyticsService.getDailyStats()
    ]);

    return {
      drivers: {
        available: availableDrivers.length,
        busy: busyDrivers.length,
        offDuty: offDutyDrivers.length,
        total: availableDrivers.length + busyDrivers.length + offDutyDrivers.length
      },
      orders: {
        active: activeOrders,
        queue: queueSize,
        today: todayStats.totalOrders,
        completed: todayStats.completedOrders,
        cancelled: todayStats.cancelledOrders
      },
      stats: todayStats
    };
  }

  // Format dashboard for WhatsApp
  async formatDashboard() {
    const dashboard = await this.getDashboard();
    
    let text = `📊 *DASHBOARD REAL-TIME*\n`;
    text += `_${Formatter.formatDate(new Date())}_\n\n`;

    text += `👨‍💼 *STATUS DRIVER:*\n`;
    text += `🟢 Siap: ${dashboard.drivers.available}\n`;
    text += `🔴 Sibuk: ${dashboard.drivers.busy}\n`;
    text += `⚪ Istirahat: ${dashboard.drivers.offDuty}\n`;
    text += `📊 Total: ${dashboard.drivers.total}\n\n`;

    text += `📦 *ORDERAN:*\n`;
    text += `⚡ Aktif: ${dashboard.orders.active}\n`;
    text += `⏳ Antrian: ${dashboard.orders.queue}\n`;
    text += `✅ Selesai Hari Ini: ${dashboard.orders.completed}\n`;
    text += `❌ Dibatalkan: ${dashboard.orders.cancelled}\n`;
    text += `📈 Total Hari Ini: ${dashboard.orders.today}\n\n`;

    text += `📊 *PERFORMA:*\n`;
    text += `Success Rate: ${dashboard.stats.completionRate}%\n`;
    text += `Avg Time: ${dashboard.stats.avgCompletionTime} menit\n\n`;

    text += `_Update: ${new Date().toLocaleTimeString('id-ID')}_`;

    return text;
  }

  // Get busy drivers
  async getBusyDrivers() {
    const Driver = require('../models/Driver');
    return await Driver.find({ status: 'Busy' });
  }

  // Get off duty drivers
  async getOffDutyDrivers() {
    const Driver = require('../models/Driver');
    return await Driver.find({ status: 'Off Duty' });
  }

  // Get detailed driver list
  async getDetailedDriverList() {
    const drivers = await driverService.getAllDriversStatus();
    
    let text = `👨‍💼 *DAFTAR LENGKAP DRIVER*\n\n`;
    
    drivers.forEach((d, idx) => {
      const statusFormatted = Formatter.formatDriverStatus(d.status);
      text += `${idx + 1}. ${statusFormatted} *${d.name}*\n`;
      text += `   Orderan hari ini: ${d.todayOrders}\n`;
      text += `   Current: ${d.currentOrder}\n\n`;
    });

    return text;
  }

  // Get recent orders
  async getRecentOrders(limit = 10) {
    const Order = require('../models/Order');
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('assignedDriver');

    let text = `📋 *${limit} ORDERAN TERAKHIR*\n\n`;
    
    orders.forEach((order, idx) => {
      const statusFormatted = Formatter.formatOrderStatus(order.status);
      const driverName = order.assignedDriver ? order.assignedDriver.name : '-';
      
      text += `${idx + 1}. ${order.orderNumber}\n`;
      text += `   ${statusFormatted}\n`;
      text += `   Driver: ${driverName}\n`;
      text += `   ${Formatter.formatRelativeTime(order.createdAt)}\n\n`;
    });

    return text;
  }

  // Admin command handler
  async handleAdminCommand(command, phone) {
    if (!this.isAdmin(phone)) {
      return 'Akses ditolak. Anda bukan admin.';
    }

    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/dashboard':
      case 'dashboard':
        return await this.formatDashboard();

      case '/drivers':
      case 'drivers':
        return await this.getDetailedDriverList();

      case '/orders':
      case 'orders':
        return await this.getRecentOrders(10);

      case '/report':
      case 'report':
        const report = await analyticsService.generateDailyReport(new Date());
        return analyticsService.formatReportForWhatsApp(report);

      case '/queue':
      case 'queue':
      case 'antrian':
        const queueSize = await queueService.getQueueSize();
        return `📝 Jumlah orderan dalam antrian: *${queueSize}*`;

      case '/help':
      case 'help':
        return this.getAdminHelp();

      default:
        return null; // Command not recognized
    }
  }

  // Admin help message
  getAdminHelp() {
    return `🔧 *ADMIN COMMANDS*\n\n` +
           `📊 Dashboard - Status real-time sistem\n` +
           `👨‍💼 Drivers - Daftar lengkap driver\n` +
           `📦 Orders - 10 orderan terakhir\n` +
           `📈 Report - Laporan harian lengkap\n` +
           `📝 Queue - Lihat antrian orderan\n` +
           `❓ Help - Bantuan admin\n\n` +
           `_Kirim command atau ketik nama command_`;
  }
}

module.exports = new AdminService();