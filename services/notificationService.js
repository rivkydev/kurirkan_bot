const config = require('../config/config');
const Formatter = require('../utils/formatter');

class NotificationService {
  constructor(client) {
    this.client = client;
  }

  async sendOptions(to, text, options) {
    try {
      let message = text + '\n\n';
      options.forEach((opt, idx) => {
        message += `${idx + 1}. ${opt.text}\n`;
      });
      message += '\n_Balas dengan nomor pilihan Anda_';
      
      await this.client.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending options:', error);
      await this.client.sendMessage(to, text);
    }
  }

  async sendWelcome(to) {
    const pengirimanTarif = Formatter.formatCurrency(config.pricing.pengiriman);
    const ojekTarif = Formatter.formatCurrency(config.pricing.ojek);
    
    const text = `Halo! Selamat datang di *Kurir Kan* 🚀

Silakan pilih layanan yang Anda butuhkan:

1. 📦 Pengiriman Barang - ${pengirimanTarif}
2. 🏍️ Ojek/Antar Jemput - ${ojekTarif}

_Balas dengan nomor pilihan (1 atau 2)_`;
    
    await this.client.sendMessage(to, text);
  }

  async sendPengirimanForm(to) {
    const text = `📦 Siap! Mari kita proses pengiriman Anda.\n\n📍 *Langkah 1/4: Lokasi Pengambilan*\nKetik alamat lengkap tempat kurir mengambil barang:`;
    await this.client.sendMessage(to, text);
  }

  async sendOjekForm(to) {
    const text = `🛵 Siap antar jemput!\n\n📍 *Langkah 1/3: Lokasi Jemput*\nKetik alamat kamu berada sekarang:`;
    await this.client.sendMessage(to, text);
  }

  // PERBAIKAN: Hanya terima chatId dengan format @c.us
  async sendOrderToDriver(driverChatId, order, timeout = 60) {
    try {
      // Pastikan format yang diterima adalah phone@c.us
      console.log(`📤 Sending order ${order.orderNumber} to ${driverChatId}`);
      
      const message = `🔔 *ORDERAN BARU*

Ada orderan baru nih!

📋 No. Pesanan: *${order.orderNumber}*
📦 Jenis: ${order.orderType}

⏰ Mohon respon dalam ${timeout} detik

Balas dengan:
1 = Terima Orderan
2 = Tolak Orderan`;

      await this.client.sendMessage(driverChatId, message);
      console.log(`✅ Order notification sent successfully to ${driverChatId}`);
      
    } catch (error) {
      console.error('Error sending order to driver:', error);
      throw error;
    }
  }

  async sendOrderDetailsToDriver(driverChatId, orderDetails) {
    try {
      await this.client.sendMessage(driverChatId, orderDetails);
      
      const actionText = `\n📍 *INSTRUKSI DRIVER:*

Setelah selesai mengantarkan:
- Ketik "selesai" untuk menyelesaikan orderan
- Ketik "batal" jika customer membatalkan

_Selamat bekerja! 🏍️_`;
      
      await this.client.sendMessage(driverChatId, actionText);
      
    } catch (error) {
      console.error('Error sending order details:', error);
    }
  }

  async sendOrderConfirmation(customerPhone, orderNumber) {
    const message = `✅ *PESANAN DITERIMA*

Terima kasih! Pesanan Anda telah kami terima.

📋 No. Pesanan: *${orderNumber}*

🔍 Kami sedang mencarikan driver untuk Anda.
⏳ Mohon tunggu sebentar...`;

    await this.client.sendMessage(customerPhone, message);
  }

  async sendDriverFound(customerPhone, driverName, orderNumber) {
    const message = `✅ *DRIVER DITEMUKAN!*

👨‍💼 Driver Anda: *${driverName}*
📋 No. Pesanan: ${orderNumber}

📞 Driver akan segera menghubungi Anda.
⏱️ Estimasi waktu: 5-10 menit 🏍️`;

    await this.client.sendMessage(customerPhone, message);
  }

  async sendCompletionMessage(customerPhone, orderNumber, driverName) {
    const message = `✅ *PESANAN SELESAI*

Terima kasih telah menggunakan layanan *Kurir Kan*! 🎉

📋 No. Pesanan: ${orderNumber}
👨‍💼 Driver: ${driverName}
✓ Status: Terkirim

💰 Silakan selesaikan pembayaran sesuai metode yang dipilih

💬 Ingin pesan lagi? Ketik "pesan" atau "menu"`;

    await this.client.sendMessage(customerPhone, message);
  }

  async sendQueueNotification(customerPhone, orderNumber) {
    const message = `⚠️ *DRIVER SEDANG TIDAK TERSEDIA*

Mohon maaf, saat ini semua driver sedang mengantarkan pesanan.

📋 No. Pesanan: ${orderNumber}

Apakah Anda ingin masuk antrian? Kami akan segera mencarikan driver.

Balas dengan:
1 = Ya, Masuk Antrian
2 = Tidak, Batalkan Pesanan`;

    await this.client.sendMessage(customerPhone, message);
  }

  async sendQueuedConfirmation(customerPhone, orderNumber) {
    const message = `📝 *PESANAN MASUK ANTRIAN*

Pesanan Anda (${orderNumber}) telah masuk antrian.

✅ Kami akan segera mencarikan driver untuk Anda
📱 Anda akan diberitahu ketika driver sudah siap

Terima kasih atas kesabaran Anda! 🙏`;

    await this.client.sendMessage(customerPhone, message);
  }

  async sendCancellationMessage(customerPhone, orderNumber, reason) {
    const message = `❌ *PESANAN DIBATALKAN*

Mohon maaf, pesanan Anda telah dibatalkan.

📋 No. Pesanan: ${orderNumber}
📝 Alasan: ${reason}

💬 Silakan pesan kembali jika berminat. Ketik "pesan"`;

    await this.client.sendMessage(customerPhone, message);
  }

  async sendDriverStatusUpdate(groupId, driverName, status) {
    const statusEmoji = status === 'On Duty' ? '🟢' : '⚪';
    const statusText = status === 'On Duty' ? 'SIAP MENERIMA ORDERAN' : 'ISTIRAHAT';
    
    const message = `${statusEmoji} *STATUS UPDATE*

Driver: ${driverName}
Status: ${statusText}`;

    await this.client.sendMessage(groupId, message);
  }
}

module.exports = NotificationService;