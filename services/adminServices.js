// ============================================
// FILE: services/adminService.js (IN-MEMORY)
// ============================================

const storage = require('../storage/inMemoryStorage');
const analyticsService = require('./analyticsService');
const driverService = require('./driverService');
const queueService = require('./queueService');
const Formatter = require('../utils/formatter');

class AdminService {
  isAdmin(phone) {
    const normalizedPhone = phone.replace('@lid', '').replace(/^0/, '62');
    const adminNumbers = ['8637615485122']; // Sesuaikan dengan nomor admin Anda
    return adminNumbers.includes(normalizedPhone);
  }

  async getDashboard() {
    const availableDrivers = driverService.getAvailableDrivers();
    const allDrivers = storage.getAllDrivers();
    const busyDrivers = allDrivers.filter(d => d.status === 'Busy');
    const offDutyDrivers = allDrivers.filter(d => d.status === 'Off Duty');
    const activeOrders = storage.getActiveOrders();
    const queueSize = queueService.getQueueSize();
    const todayStats = analyticsService.getDailyStats();

    return {
      drivers: {
        available: availableDrivers.length,
        busy: busyDrivers.length,
        offDuty: offDutyDrivers.length,
        total: allDrivers.length
      },
      orders: {
        active: activeOrders.length,
        queue: queueSize,
        today: todayStats.totalOrders,
        completed: todayStats.completedOrders,
        cancelled: todayStats.cancelledOrders
      },
      stats: todayStats
    };
  }

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

  async getDetailedDriverList() {
    const drivers = driverService.getAllDriversStatus();
    
    let text = `👨‍💼 *DAFTAR LENGKAP DRIVER*\n\n`;
    
    drivers.forEach((d, idx) => {
      const statusFormatted = Formatter.formatDriverStatus(d.status);
      text += `${idx + 1}. ${statusFormatted} *${d.name}*\n`;
      text += `   Orderan hari ini: ${d.todayOrders}\n`;
      text += `   Current: ${d.currentOrder}\n\n`;
    });

    return text;
  }

  async getRecentOrders(limit = 10) {
    const allOrders = Array.from(storage.orders.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    let text = `📋 *${limit} ORDERAN TERAKHIR*\n\n`;
    
    allOrders.forEach((order, idx) => {
      const statusFormatted = Formatter.formatOrderStatus(order.status);
      const driverName = order.assignedDriver 
        ? (storage.getDriver(order.assignedDriver)?.name || '-')
        : '-';
      
      text += `${idx + 1}. ${order.orderNumber}\n`;
      text += `   ${statusFormatted}\n`;
      text += `   Driver: ${driverName}\n`;
      text += `   ${Formatter.formatRelativeTime(order.createdAt)}\n\n`;
    });

    return text;
  }

  async handleAdminCommand(command, phone) {
    if (!this.isAdmin(phone)) {
      return null; // Not admin, don't handle
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
        const queueSize = queueService.getQueueSize();
        return `📝 Jumlah orderan dalam antrian: *${queueSize}*`;

      case '/save':
      case 'save':
        storage.saveToFile();
        return `💾 Data berhasil disimpan!`;

      case '/stats':
      case 'stats':
        const stats = storage.getDailyStats();
        return `📊 *STATISTIK*\n\n` +
               `Total Orders: ${stats.totalOrders}\n` +
               `Completed: ${stats.completedOrders}\n` +
               `Active: ${stats.activeOrders}\n` +
               `Queue: ${queueService.getQueueSize()}\n` +
               `Success Rate: ${stats.completionRate}%`;

      case '/help':
      case 'help':
        return this.getAdminHelp();

      default:
        return null; // Unknown command
    }
  }

  getAdminHelp() {
    return `🔧 *ADMIN COMMANDS*\n\n` +
           `📊 Dashboard - Status real-time sistem\n` +
           `👨‍💼 Drivers - Daftar lengkap driver\n` +
           `📦 Orders - 10 orderan terakhir\n` +
           `📈 Report - Laporan harian lengkap\n` +
           `📝 Queue - Lihat antrian orderan\n` +
           `💾 Save - Simpan data manual\n` +
           `📊 Stats - Statistik singkat\n` +
           `❓ Help - Bantuan admin\n\n` +
           `_Kirim command atau ketik nama command_`;
  }
}

module.exports = new AdminService();