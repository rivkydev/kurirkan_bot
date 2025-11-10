// ============================================
// FILE: services/analyticsService.js
// ============================================

const Order = require('../models/Order');
const Driver = require('../models/Driver');

class AnalyticsService {
  // Get daily statistics
  async getDailyStats(date = new Date()) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      avgCompletionTime
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),

      // Completed orders
      Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'DELIVERED'
      }),

      // Cancelled orders
      Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'CANCELLED'
      }),

      // Active orders
      Order.countDocuments({
        status: { $in: ['NEW', 'AWAITING_DRIVER', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] }
      }),

      // Average completion time
      this.getAvgCompletionTime(startOfDay, endOfDay)
    ]);

    return {
      date: startOfDay,
      totalOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      avgCompletionTime,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0
    };
  }

  // Get driver statistics
  async getDriverStats(driverId = null) {
    const match = driverId ? { _id: driverId } : {};
    
    const drivers = await Driver.find(match).lean();

    const stats = await Promise.all(drivers.map(async (driver) => {
      const [totalOrders, completedToday, avgRating] = await Promise.all([
        Order.countDocuments({ assignedDriver: driver._id }),
        Order.countDocuments({
          assignedDriver: driver._id,
          status: 'DELIVERED',
          completedAt: {
            $gte: new Date().setHours(0, 0, 0, 0)
          }
        }),
        this.getDriverAvgRating(driver._id)
      ]);

      return {
        driverId: driver.driverId,
        name: driver.name,
        status: driver.status,
        totalOrders: driver.totalOrders,
        todayOrders: driver.todayOrders,
        completedToday,
        avgRating: avgRating || 'N/A'
      };
    }));

    return stats;
  }

  // Get average completion time
  async getAvgCompletionTime(startDate, endDate) {
    const result = await Order.aggregate([
      {
        $match: {
          status: 'DELIVERED',
          createdAt: { $gte: startDate, $lte: endDate },
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          completionTime: {
            $subtract: ['$completedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$completionTime' }
        }
      }
    ]);

    if (result.length === 0) return 0;

    // Convert milliseconds to minutes
    return Math.round(result[0].avgTime / 60000);
  }

  // Get driver average rating (placeholder - implement rating system)
  async getDriverAvgRating(driverId) {
    // TODO: Implement rating system
    return null;
  }

  // Get order type breakdown
  async getOrderTypeBreakdown(startDate, endDate) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 }
        }
      }
    ]);

    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  // Get peak hours
  async getPeakHours(startDate, endDate) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          hour: { $hour: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return result.map(item => ({
      hour: `${item._id}:00`,
      orders: item.count
    }));
  }

  // Generate daily report
  async generateDailyReport(date = new Date()) {
    const [
      dailyStats,
      driverStats,
      orderTypeBreakdown,
      peakHours
    ] = await Promise.all([
      this.getDailyStats(date),
      this.getDriverStats(),
      this.getOrderTypeBreakdown(
        new Date(date.setHours(0, 0, 0, 0)),
        new Date(date.setHours(23, 59, 59, 999))
      ),
      this.getPeakHours(
        new Date(date.setHours(0, 0, 0, 0)),
        new Date(date.setHours(23, 59, 59, 999))
      )
    ]);

    return {
      date: date.toISOString().split('T')[0],
      summary: dailyStats,
      drivers: driverStats,
      orderTypes: orderTypeBreakdown,
      peakHours
    };
  }

  // Format report for WhatsApp
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

    text += `⏰ *JAM SIBUK:*\n`;
    report.peakHours.forEach((peak, idx) => {
      text += `${idx + 1}. ${peak.hour} - ${peak.orders} order\n`;
    });

    return text;
  }
}

module.exports = new AnalyticsService();