// ============================================
// FILE: services/analyticsService.js (IN-MEMORY)
// ============================================

const storage = require('../storage/inMemoryStorage');

class AnalyticsService {
  getDailyStats(date = new Date()) {
    return storage.getDailyStats(date);
  }

  getDriverStats(driverId = null) {
    const drivers = driverId 
      ? [storage.getDriver(driverId)] 
      : storage.getAllDrivers();

    return drivers.filter(Boolean).map(driver => ({
      driverId: driver.driverId,
      name: driver.name,
      status: driver.status,
      totalOrders: driver.totalOrders,
      todayOrders: driver.todayOrders,
      completedToday: driver.todayOrders,
      avgRating: 'N/A'
    }));
  }

  async generateDailyReport(date = new Date()) {
    const dailyStats = this.getDailyStats(date);
    const driverStats = this.getDriverStats();

    return {
      date: date.toISOString().split('T')[0],
      summary: dailyStats,
      drivers: driverStats,
      orderTypes: this.getOrderTypeBreakdown(date),
      peakHours: []
    };
  }

  getOrderTypeBreakdown(date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const ordersToday = Array.from(storage.orders.values())
      .filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay);

    const breakdown = {};
    ordersToday.forEach(order => {
      breakdown[order.orderType] = (breakdown[order.orderType] || 0) + 1;
    });

    return breakdown;
  }

  formatReportForWhatsApp(report) {
    let text = `📊 *LAPORAN HARIAN*\n`;
    text += `Tanggal: ${report.date}\n\n`;

    text += `📈 *RINGKASAN:*\n`;
    text += `Total Order: ${report.summary.totalOrders}\n`;
    text += `Selesai: ${report.summary.completedOrders}\n`;
    text += `Dibatalkan: ${report.summary.cancelledOrders}\n`;
    text += `Aktif: ${report.summary.activeOrders}\n`;
    text += `Success Rate: ${report.summary.completionRate}%\n`;
    text += `Rata-rata Waktu: ${report.summary.avgCompletionTime} menit\n\n`;

    text += `👨‍💼 *PERFORMA DRIVER:*\n`;
    report.drivers.forEach(driver => {
      text += `${driver.name}: ${driver.todayOrders} order\n`;
    });
    text += `\n`;

    text += `📦 *JENIS ORDER:*\n`;
    Object.entries(report.orderTypes).forEach(([type, count]) => {
      text += `${type}: ${count}\n`;
    });

    return text;
  }
}

module.exports = new AnalyticsService();