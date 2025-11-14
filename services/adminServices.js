// ============================================
// FILE: services/adminService.js (COMPLETE ADMIN FEATURES)
// ============================================

const storage = require('../storage/inMemoryStorage');
const analyticsService = require('./analyticsService');
const driverService = require('./driverService');
const queueService = require('./queueService');
const Formatter = require('../utils/formatter');

class AdminService {
  isAdmin(lid) {
    const normalizedLID = lid.replace('@lid', '').replace('@c.us', '').replace(/[\s-]/g, '');
    return storage.isAdmin(normalizedLID);
  }

  // ========== DASHBOARD ==========
  
  async getDashboard() {
    const availableDrivers = driverService.getAvailableDrivers();
    const allDrivers = storage.getAllDrivers();
    const busyDrivers = allDrivers.filter(d => d.status === 'Busy');
    const offDutyDrivers = allDrivers.filter(d => d.status === 'Off Duty');
    const suspendedDrivers = allDrivers.filter(d => d.isSuspended);
    const activeOrders = storage.getActiveOrders();
    const queueSize = queueService.getQueueSize();
    const todayStats = analyticsService.getDailyStats();

    return {
      drivers: {
        available: availableDrivers.length,
        busy: busyDrivers.length,
        offDuty: offDutyDrivers.length,
        suspended: suspendedDrivers.length,
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
    
    let text = `📊 *DASHBOARD ADMIN*\n`;
    text += `_${Formatter.formatDate(new Date())}_\n\n`;

    text += `👨‍💼 *STATUS DRIVER:*\n`;
    text += `🟢 Siap: ${dashboard.drivers.available}\n`;
    text += `🔴 Sibuk: ${dashboard.drivers.busy}\n`;
    text += `⚪ Istirahat: ${dashboard.drivers.offDuty}\n`;
    text += `🚫 Suspend: ${dashboard.drivers.suspended}\n`;
    text += `📊 Total: ${dashboard.drivers.total}\n\n`;

    text += `📦 *ORDERAN:*\n`;
    text += `⚡ Aktif: ${dashboard.orders.active}\n`;
    text += `⏳ Antrian: ${dashboard.orders.queue}\n`;
    text += `✅ Selesai: ${dashboard.orders.completed}\n`;
    text += `❌ Dibatalkan: ${dashboard.orders.cancelled}\n`;
    text += `📈 Total Hari Ini: ${dashboard.orders.today}\n\n`;

    text += `📊 *PERFORMA:*\n`;
    text += `Success Rate: ${dashboard.stats.completionRate}%\n`;
    text += `Avg Time: ${dashboard.stats.avgCompletionTime} menit\n\n`;

    text += `_Update: ${new Date().toLocaleTimeString('id-ID')}_`;

    return text;
  }

  // ========== DRIVER MANAGEMENT ==========
  
  async registerDriverStep1(phone, name) {
    try {
      // Normalize phone
      let normalizedPhone = phone.replace(/[\s-]/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '62' + normalizedPhone.slice(1);
      }
      if (normalizedPhone.startsWith('62')) {
        normalizedPhone = normalizedPhone.substring(2);
      }

      // Check if phone already registered
      const existingDriver = storage.getDriverByPhone(normalizedPhone);
      if (existingDriver) {
        return {
          success: false,
          message: `❌ Nomor ${phone} sudah terdaftar sebagai driver ${existingDriver.name}.`
        };
      }

      // Generate token
      const token = storage.generateRegistrationToken(normalizedPhone, name);

      return {
        success: true,
        token,
        phone: normalizedPhone,
        message: `✅ *TOKEN REGISTRASI DIBUAT*\n\n` +
                 `📱 Nomor: ${phone}\n` +
                 `👤 Nama: ${name}\n` +
                 `🔑 Token: *${token}*\n\n` +
                 `*INSTRUKSI UNTUK DRIVER:*\n\n` +
                 `1. Minta driver hubungi bot ini dengan nomor ${phone}\n` +
                 `2. Driver ketik: /daftar ${token}\n\n` +
                 `⏰ Token berlaku 24 jam\n` +
                 `⚠️ Token hanya bisa digunakan 1x`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Gagal membuat token: ${error.message}`
      };
    }
  }

  async registerDriverStep2(token, lid) {
    try {
      const driver = storage.useRegistrationToken(token, lid);
      
      return {
        success: true,
        driver,
        message: `✅ *REGISTRASI BERHASIL!*\n\n` +
                 `Selamat datang di *Kurir Kan*! 🎉\n\n` +
                 `ID Driver: ${driver.driverId}\n` +
                 `Nama: ${driver.name}\n` +
                 `Phone: ${driver.phone}\n\n` +
                 `*CARA KERJA:*\n\n` +
                 `1. Join grup driver\n` +
                 `2. Ketik "On Duty" untuk siap menerima orderan\n` +
                 `3. Ketik "Off Duty" untuk istirahat\n\n` +
                 `Selamat bekerja! 🏍️`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ ${error.message}\n\nHubungi admin untuk token baru.`
      };
    }
  }

  async suspendDriver(driverId, reason = 'Belum menyetor') {
    try {
      const driver = storage.suspendDriver(driverId, reason);
      
      return {
        success: true,
        message: `🚫 Driver ${driver.name} (${driverId}) disuspend.\n\n` +
                 `Alasan: ${reason}\n\n` +
                 `Driver tidak akan menerima orderan hingga diaktifkan kembali.`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Gagal suspend driver: ${error.message}`
      };
    }
  }

  async activateDriver(driverId) {
    try {
      const driver = storage.activateDriver(driverId);
      
      return {
        success: true,
        message: `✅ Driver ${driver.name} (${driverId}) diaktifkan kembali.\n\n` +
                 `Driver sudah bisa menerima orderan.`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Gagal aktivasi driver: ${error.message}`
      };
    }
  }

  async getDriverList() {
    const drivers = storage.getAllDrivers();
    
    let text = `👨‍💼 *DAFTAR DRIVER*\n\n`;
    
    drivers.forEach((d, idx) => {
      const statusEmoji = d.isSuspended ? '🚫' : 
                         d.status === 'On Duty' ? '🟢' : 
                         d.status === 'Busy' ? '🔴' : '⚪';
      
      text += `${idx + 1}. ${statusEmoji} *${d.name}*\n`;
      text += `   ID: ${d.driverId}\n`;
      text += `   Phone: ${d.phone}\n`;
      text += `   LID: ${d.lid || 'Belum aktif'}\n`;
      text += `   Status: ${d.isSuspended ? 'SUSPEND' : d.status}\n`;
      text += `   Orderan: ${d.todayOrders} hari ini\n`;
      if (d.isSuspended) {
        text += `   ⚠️ ${d.suspensionReason}\n`;
      }
      text += `\n`;
    });

    return text;
  }

  // ========== DEPOSIT MANAGEMENT ==========
  
  async recordDeposit(driverId, amount) {
    try {
      const driver = storage.getDriver(driverId);
      if (!driver) throw new Error('Driver tidak ditemukan');

      storage.recordDeposit(driverId, amount);
      
      // Auto-activate if was suspended for deposit
      if (driver.isSuspended && driver.suspensionReason?.includes('setor')) {
        storage.activateDriver(driverId);
      }

      const total = storage.getTotalDeposit(driverId);

      return {
        success: true,
        message: `✅ Setoran ${driver.name} tercatat!\n\n` +
                 `Jumlah: ${Formatter.formatCurrency(amount)}\n` +
                 `Total Hari Ini: ${Formatter.formatCurrency(total)}\n` +
                 `Wajib: ${Formatter.formatCurrency(storage.dailyDepositRequired)}\n\n` +
                 `${total >= storage.dailyDepositRequired ? '✅ Setoran wajib terpenuhi' : '⚠️ Belum memenuhi setoran wajib'}`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Gagal mencatat setoran: ${error.message}`
      };
    }
  }

  async checkDeposits() {
    const drivers = storage.getAllDrivers().filter(d => d.driverId !== 'DRV001'); // Skip admin
    
    let text = `💰 *LAPORAN SETORAN HARI INI*\n\n`;
    
    drivers.forEach((d, idx) => {
      const total = storage.getTotalDeposit(d.driverId);
      const hasDeposited = total >= storage.dailyDepositRequired;
      const icon = hasDeposited ? '✅' : '❌';
      
      text += `${idx + 1}. ${icon} ${d.name}\n`;
      text += `   Total: ${Formatter.formatCurrency(total)}\n`;
      text += `   Status: ${hasDeposited ? 'Lunas' : 'Belum lunas'}\n\n`;
    });

    text += `\n💵 Wajib setor: ${Formatter.formatCurrency(storage.dailyDepositRequired)}/hari`;

    return text;
  }

  // ========== REPORTS ==========
  
  async getDailyReport() {
    const report = await analyticsService.generateDailyReport(new Date());
    return analyticsService.formatReportForWhatsApp(report);
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

  // ========== COMMAND HANDLER ==========
  
  async handleAdminCommand(command, lid, args = []) {
    if (!this.isAdmin(lid)) {
      return null; // Not admin
    }

    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/dashboard':
      case '/dash':
        return await this.formatDashboard();

      case '/daftardriver':
        if (args.length < 2) {
          return `❌ Format salah!\n\nContoh:\n/daftardriver 081234567890 Nama Driver`;
        }
        return (await this.registerDriverStep1(args[0], args.slice(1).join(' '))).message;

      case '/suspend':
        if (args.length < 1) {
          return `❌ Format salah!\n\nContoh:\n/suspend DRV002\natau\n/suspend DRV002 Alasan suspend`;
        }
        const reason = args.slice(1).join(' ') || 'Belum menyetor';
        return (await this.suspendDriver(args[0], reason)).message;

      case '/aktifkan':
      case '/activate':
        if (args.length < 1) {
          return `❌ Format salah!\n\nContoh:\n/aktifkan DRV002`;
        }
        return (await this.activateDriver(args[0])).message;

      case '/drivers':
      case '/listdriver':
        return await this.getDriverList();

      case '/setor':
        if (args.length < 2) {
          return `❌ Format salah!\n\nContoh:\n/setor DRV002 5000`;
        }
        return (await this.recordDeposit(args[0], parseInt(args[1]))).message;

      case '/ceksetor':
      case '/deposits':
        return await this.checkDeposits();

      case '/report':
      case '/laporan':
        return await this.getDailyReport();

      case '/orders':
      case '/orderan':
        const limit = parseInt(args[0]) || 10;
        return await this.getRecentOrders(limit);

      case '/queue':
      case '/antrian':
        const queueSize = queueService.getQueueSize();
        return `📝 Jumlah orderan dalam antrian: *${queueSize}*`;

      case '/save':
        storage.saveToFile();
        return `💾 Data berhasil disimpan!`;

      case '/stats':
        const stats = storage.getDailyStats();
        return `📊 *STATISTIK*\n\n` +
               `Total Orders: ${stats.totalOrders}\n` +
               `Completed: ${stats.completedOrders}\n` +
               `Active: ${stats.activeOrders}\n` +
               `Queue: ${queueService.getQueueSize()}\n` +
               `Success Rate: ${stats.completionRate}%`;

      case '/admin':
      case '/help':
        return this.getAdminHelp();

      default:
        return null; // Unknown command
    }
  }

  getAdminHelp() {
    return `🔧 *COMMAND ADMIN*\n\n` +
           `📊 *Dashboard & Monitoring*\n` +
           `/dashboard - Dashboard real-time\n` +
           `/stats - Statistik singkat\n` +
           `/report - Laporan harian\n` +
           `/orders [jumlah] - Orderan terakhir\n` +
           `/queue - Lihat antrian\n\n` +
           
           `👨‍💼 *Manajemen Driver*\n` +
           `/daftardriver <phone> <nama> - Daftar driver baru\n` +
           `/drivers - Daftar semua driver\n` +
           `/suspend <ID> [alasan] - Suspend driver\n` +
           `/aktifkan <ID> - Aktifkan driver\n\n` +
           
           `💰 *Setoran*\n` +
           `/setor <ID> <jumlah> - Catat setoran\n` +
           `/ceksetor - Cek setoran hari ini\n\n` +
           
           `⚙️ *Sistem*\n` +
           `/save - Simpan data manual\n` +
           `/admin - Bantuan admin\n\n` +
           
           `_Contoh penggunaan:_\n` +
           `• /daftardriver 081234567890 Budi\n` +
           `• /suspend DRV002 Belum bayar\n` +
           `• /setor DRV002 5000\n` +
           `• /orders 20`;
  }
}

module.exports = new AdminService();