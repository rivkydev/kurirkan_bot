// ============================================
// FILE: services/notificationService.js (COMPLETE WITH IMPORTS)
// ============================================

const config = require('../config/config');
const Formatter = require('../utils/formatter');

class NotificationService {
  constructor(client) {
    this.client = client;
  }

  // Send text with numbered options (no buttons)
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

  // Send welcome message (CUSTOMER ONLY) - WITH PRICING
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

  // Send pengiriman form (CUSTOMER ONLY) - WITH PRICING
  async sendPengirimanForm(to) {
    const tarif = Formatter.formatCurrency(config.pricing.pengiriman);
    
    const formText = `📋 *FORM PEMESANAN PENGIRIMAN*
💰 Tarif: ${tarif}

Silakan isi form berikut dengan format yang benar:

Nama Pengirim: [Isi]
Nomor HP Pengirim: [Isi]
Lokasi Pengambilan: [Alamat lengkap]
Nama Toko/Restoran: [Isi]
Deskripsi Pesanan: [Detail pesanan]
Nama Penerima: [Isi]
Nomor HP Penerima: [Isi]
Lokasi Pengantaran: [Alamat lengkap]
Waktu Diinginkan: [ASAP/Jam]
Metode Pembayaran: [COD/Transfer/E-wallet]
Catatan Tambahan: [Opsional]

_Kirim form yang sudah diisi!_`;

    await this.client.sendMessage(to, formText);
  }

  // Send ojek form (CUSTOMER ONLY) - WITH PRICING
  async sendOjekForm(to) {
    const tarif = Formatter.formatCurrency(config.pricing.ojek);
    
    const formText = `📋 *FORM PEMESANAN OJEK*
💰 Tarif: ${tarif}

Silakan isi form berikut dengan format yang benar:

Nama Penumpang: [Isi]
Nomor HP: [Isi]
Lokasi Jemput: [Alamat lengkap]
Patokan Lokasi Jemput: [Landmark/detail]
Lokasi Tujuan: [Alamat lengkap]
Patokan Lokasi Tujuan: [Landmark/detail]
Jumlah Penumpang: [1/2]
Waktu Jemput: [ASAP/Jam]
Metode Pembayaran: [COD/Transfer/E-wallet]
Catatan Tambahan: [Opsional]

_Kirim form yang sudah diisi!_`;

    await this.client.sendMessage(to, formText);
  }

  // Send order to driver (DRIVER ONLY - SIMPLIFIED)
  async sendOrderToDriver(driverContactId, order, timeout = 60) {
    try {
      // driverContactId sudah dalam format lengkap: 8637615485122@lid atau 628xxx@c.us
      const message = `🔔 *ORDERAN BARU*

Ada orderan baru nih!

📋 No. Pesanan: *${order.orderNumber}*
📦 Jenis: ${order.orderType}

⏰ Mohon respon dalam ${timeout} detik

Balas dengan:
1 = Terima Orderan
2 = Tolak Orderan`;

      await this.client.sendMessage(driverContactId, message);
      
      console.log(`✅ Order notification sent to ${driverContactId}`);
      
    } catch (error) {
      console.error('Error sending order to driver:', error);
      throw error;
    }
  }

  // Send FULL order details to driver (AFTER ACCEPTANCE) - WITH PRICING
  async sendOrderDetailsToDriver(driverChatId, orderDetails) {
    try {
      // Kirim detail lengkap orderan
      await this.client.sendMessage(driverChatId, orderDetails);
      
      // Kirim instruksi action
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

  // Send order confirmation to customer (CUSTOMER ONLY) - WITH PRICING
  async sendOrderConfirmation(customerPhone, orderNumber) {
    const message = `✅ *PESANAN DITERIMA*

Terima kasih! Pesanan Anda telah kami terima.

📋 No. Pesanan: *${orderNumber}*

🔍 Kami sedang mencarikan driver untuk Anda.
⏳ Mohon tunggu sebentar...`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send driver found notification (CUSTOMER ONLY) - WITH PRICING
  async sendDriverFound(customerPhone, driverName, orderNumber) {
    const message = `✅ *DRIVER DITEMUKAN!*

👨‍💼 Driver Anda: *${driverName}*
📋 No. Pesanan: ${orderNumber}

📞 Driver akan segera menghubungi Anda.
⏱️ Estimasi waktu: 5-10 menit 🏍️`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send completion message to customer (CUSTOMER ONLY) - WITH PRICING INFO
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

  // Send queue notification (CUSTOMER ONLY)
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

  // Send queued confirmation (CUSTOMER ONLY)
  async sendQueuedConfirmation(customerPhone, orderNumber) {
    const message = `📝 *PESANAN MASUK ANTRIAN*

Pesanan Anda (${orderNumber}) telah masuk antrian.

✅ Kami akan segera mencarikan driver untuk Anda
📱 Anda akan diberitahu ketika driver sudah siap

Terima kasih atas kesabaran Anda! 🙏`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send cancellation message (CUSTOMER ONLY)
  async sendCancellationMessage(customerPhone, orderNumber, reason) {
    const message = `❌ *PESANAN DIBATALKAN*

Mohon maaf, pesanan Anda telah dibatalkan.

📋 No. Pesanan: ${orderNumber}
📝 Alasan: ${reason}

💬 Silakan pesan kembali jika berminat. Ketik "pesan"`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send driver status update confirmation (DRIVER ONLY - GROUP)
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