// ============================================
// FILE: utils/formatter.js
// ============================================

class Formatter {
  // Format phone number to WhatsApp format
  static formatPhoneForWA(phone) {
    let normalized = phone.replace(/[\s\-\+]/g, '');
    
    // Remove leading 0 and add 62
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.slice(1);
    }
    
    // Add @c.us if not present
    if (!normalized.endsWith('@c.us')) {
      normalized += '@c.us';
    }
    
    return normalized;
  }

  // Format phone for display (e.g., 0812-3456-7890)
  static formatPhoneDisplay(phone) {
    const cleaned = phone.replace(/[\s\-\+@c.us]/g, '');
    
    // Convert 62 to 0
    let display = cleaned.startsWith('62') ? '0' + cleaned.slice(2) : cleaned;
    
    // Format with dashes
    if (display.length >= 10) {
      return `${display.slice(0, 4)}-${display.slice(4, 8)}-${display.slice(8)}`;
    }
    
    return display;
  }

  // Format currency to Rupiah
  static formatCurrency(amount) {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }

  // Format date to Indonesian format
  static formatDate(date, includeTime = true) {
    const d = new Date(date);
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('id-ID', options);
  }

  // Format relative time (e.g., "5 menit yang lalu")
  static formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} hari yang lalu`;
    if (hours > 0) return `${hours} jam yang lalu`;
    if (minutes > 0) return `${minutes} menit yang lalu`;
    return 'Baru saja';
  }

  // Format duration in minutes
  static formatDuration(minutes) {
    if (minutes < 60) return `${minutes} menit`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
  }

  // Format order status to Indonesian
  static formatOrderStatus(status) {
    const statusMap = {
      'NEW': '🆕 Pesanan Baru',
      'AWAITING_DRIVER': '⏳ Menunggu Driver',
      'ASSIGNED': '✅ Driver Ditemukan',
      'PICKED_UP': '📦 Barang Diambil',
      'IN_TRANSIT': '🚚 Dalam Perjalanan',
      'DELIVERED': '✅ Terkirim',
      'CANCELLED': '❌ Dibatalkan'
    };
    
    return statusMap[status] || status;
  }

  // Format driver status
  static formatDriverStatus(status) {
    const statusMap = {
      'On Duty': '🟢 Siap',
      'Off Duty': '⚪ Istirahat',
      'Busy': '🔴 Sibuk'
    };
    
    return statusMap[status] || status;
  }

  // Format address (truncate if too long)
  static formatAddress(address, maxLength = 50) {
    if (address.length <= maxLength) return address;
    return address.slice(0, maxLength - 3) + '...';
  }

  // Format order summary for notifications
  static formatOrderSummary(order) {
    let summary = `📋 *${order.orderNumber}*\n`;
    summary += `Jenis: ${order.orderType}\n`;
    
    if (order.orderType === 'Pengiriman') {
      summary += `Dari: ${this.formatAddress(order.pengiriman.lokasiPengambilan, 30)}\n`;
      summary += `Ke: ${this.formatAddress(order.pengiriman.lokasiPengantaran, 30)}\n`;
    } else if (order.orderType === 'Ojek') {
      summary += `Dari: ${this.formatAddress(order.ojek.lokasiJemput, 30)}\n`;
      summary += `Ke: ${this.formatAddress(order.ojek.lokasiTujuan, 30)}\n`;
    }
    
    return summary;
  }

  // Format timeline entry
  static formatTimeline(timeline) {
    return timeline.map(entry => {
      const time = this.formatDate(entry.timestamp);
      const status = this.formatOrderStatus(entry.status);
      const note = entry.note ? ` - ${entry.note}` : '';
      return `${status} (${time})${note}`;
    }).join('\n');
  }

  // Format percentage
  static formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
  }

  // Format statistics table
  static formatStatsTable(stats) {
    let table = '```\n';
    const maxLabelLength = Math.max(...stats.map(s => s.label.length));
    
    stats.forEach(stat => {
      const label = stat.label.padEnd(maxLabelLength);
      const value = String(stat.value).padStart(8);
      table += `${label} : ${value}\n`;
    });
    
    table += '```';
    return table;
  }

  // Clean text for WhatsApp (remove special chars that might cause issues)
  static cleanTextForWA(text) {
    return text
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
      .replace(/\r\n/g, '\n') // Normalize line breaks
      .trim();
  }

  // Truncate text with ellipsis
  static truncate(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  // Format menu with numbers
  static formatMenu(items) {
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  }

  // Format list with bullets
  static formatList(items, bullet = '•') {
    return items.map(item => `${bullet} ${item}`).join('\n');
  }

  // Format error message
  static formatError(error, userFriendly = true) {
    if (userFriendly) {
      const friendlyMessages = {
        'validation': 'Data yang Anda masukkan tidak valid',
        'not found': 'Data tidak ditemukan',
        'timeout': 'Waktu tunggu habis',
        'network': 'Terjadi masalah koneksi'
      };

      const errorLower = error.toLowerCase();
      for (const [key, message] of Object.entries(friendlyMessages)) {
        if (errorLower.includes(key)) return message;
      }

      return 'Terjadi kesalahan. Silakan coba lagi.';
    }

    return error;
  }

  // Format success message
  static formatSuccess(message) {
    return `✅ ${message}`;
  }

  // Format warning message
  static formatWarning(message) {
    return `⚠️ ${message}`;
  }

  // Format info message
  static formatInfo(message) {
    return `ℹ️ ${message}`;
  }
}

module.exports = Formatter;