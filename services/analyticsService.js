// ============================================
// FILE: services/analyticsService.js (IN-MEMORY)
// ============================================

const storage = require('../storage/inMemoryStorage');

class AnalyticsService {
  getDailyStats(date = new Date()) {
    return storage.getDailyStats(date);
  }

  async getDriverStats() {
    const drivers = storage.getAllDrivers();
    const today = new Date().setHours(0, 0, 0, 0);

    return drivers.map(driver => {
      // Count completed orders today
      const allOrders = storage.getOrdersByCustomer('*') || []; // Get all orders
      const driverOrders = Array.from(storage.orders.values())
        .filter(o => o.assignedDriver === driver.driverId);
      
      const completedToday = driverOrders.filter(o => 
        o.status === 'DELIVERED' && 
        o.completedAt &&
        new Date(o.completedAt).setHours(0, 0, 0, 0) === today
      ).length;

      return {
        driverId: driver.driverId,
        name: driver.name,
        status: driver.status,
        totalOrders: driver.totalOrders,
        todayOrders: driver.todayOrders,
        completedToday
      };
    });
  }

  async generateDailyReport(date = new Date()) {
    const dailyStats = this.getDailyStats(date);
    const driverStats = await this.getDriverStats();

    // Get order type breakdown
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const ordersToday = Array.from(storage.orders.values())
      .filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay);

    const orderTypeBreakdown = ordersToday.reduce((acc, order) => {
      acc[order.orderType] = (acc[order.orderType] || 0) + 1;
      return acc;
    }, {});

    // Get peak hours
    const hourCounts = ordersToday.reduce((acc, order) => {
      const hour = new Date(order.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        orders: count
      }));

    return {
      date: date.toISOString().split('T')[0],
      summary: dailyStats,
      drivers: driverStats,
      orderTypes: orderTypeBreakdown,
      peakHours
    };
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
      text += `${driver.name}: ${driver.completedToday}/${driver.todayOrders} order\n`;
    });
    text += `\n`;

    text += `📦 *JENIS ORDER:*\n`;
    Object.entries(report.orderTypes).forEach(([type, count]) => {
      text += `${type}: ${count}\n`;
    });
    text += `\n`;

    if (report.peakHours && report.peakHours.length > 0) {
      text += `⏰ *JAM SIBUK:*\n`;
      report.peakHours.forEach((peak, idx) => {
        text += `${idx + 1}. ${peak.hour} - ${peak.orders} order\n`;
      });
    }

    return text;
  }
}

module.exports = new AnalyticsService();