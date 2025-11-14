// ============================================
// FILE: services/notificationService.js (FIXED LID ISSUE)
// ============================================

const config = require('../config/config');
const Formatter = require('../utils/formatter');

class NotificationService {
  constructor(client) {
    this.client = client;
  }

  // Helper: Get correct chat ID format
  async getChatId(contactId) {
    try {
      // contactId can be:
      // - 8637615485122@lid
      // - 628123456789@c.us
      // - 8637615485122 (raw LID)
      // - 628123456789 (raw phone)

      // If already formatted, return as is
      if (contactId.includes('@')) {
        return contactId;
      }

      // Try to get contact and check which format works
      // First try @lid format
      try {
        const lidFormat = `${contactId}@lid`;
        const contact = await this.client.getContactById(lidFormat);
        if (contact) return lidFormat;
      } catch (e) {
        // LID not found, try c.us
      }

      // Try @c.us format
      try {
        const phoneFormat = `${contactId}@c.us`;
        const contact = await this.client.getContactById(phoneFormat);
        if (contact) return phoneFormat;
      } catch (e) {
        // Neither worked
      }

      // Default to @c.us if nothing worked
      return `${contactId}@c.us`;
      
    } catch (error) {
      console.error('Error getting chat ID:', error);
      // Fallback to @c.us
      return contactId.includes('@') ? contactId : `${contactId}@c.us`;
    }
  }

  // Send text with numbered options (no buttons)
  async sendOptions(to, text, options) {
    try {
      let message = text + '\n\n';
      options.forEach((opt, idx) => {
        message += `${idx + 1}. ${opt.text}\n`;
      });
      message += '\n_Balas dengan nomor pilihan Anda_';
      
      const chatId = await this.getChatId(to);
      await this.client.sendMessage(chatId, message);
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
    
    const chatId = await this.getChatId(to);
    await this.client.sendMessage(chatId, text);
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

    const chatId = await this.getChatId(to);
    await this.client.sendMessage(chatId, formText);
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

    const chatId = await this.getChatId(to);
    await this.client.sendMessage(chatId, formText);
  }

  // Send order to driver (DRIVER ONLY - FIXED LID)
  async sendOrderToDriver(driverContactId, order, timeout = 60) {
    try {
      const message = `🔔 *ORDERAN BARU*

Ada orderan baru nih!

📋 No. Pesanan: *${order.orderNumber}*
📦 Jenis: ${order.orderType}

⏰ Mohon respon dalam ${timeout} detik

Balas dengan:
1 = Terima Orderan
2 = Tolak Orderan`;

      // Use getChatId to get correct format
      const chatId = await this.getChatId(driverContactId);
      console.log(`📤 Sending to driver: ${chatId}`);
      
      await this.client.sendMessage(chatId, message);
      
      console.log(`✅ Order notification sent successfully`);
      return true;
      
    } catch (error) {
      console.error('Error sending order to driver:', error);
      
      // Try sending to group instead as fallback
      console.log(`⚠️ Failed to send to driver directly, notification may need manual handling`);
      return false;
    }
  }

  // Send FULL order details to driver (AFTER ACCEPTANCE) - WITH PRICING
  async sendOrderDetailsToDriver(driverChatId, orderDetails) {
    try {
      const chatId = await this.getChatId(driverChatId);
      
      // Kirim detail lengkap orderan
      await this.client.sendMessage(chatId, orderDetails);
      
      // Kirim instruksi action
      const actionText = `\n📍 *INSTRUKSI DRIVER:*

Setelah selesai mengantarkan:
- Ketik "selesai" untuk menyelesaikan orderan
- Ketik "batal" jika customer membatalkan

_Selamat bekerja! 🏍️_`;
      
      await this.client.sendMessage(chatId, actionText);
      
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

    const chatId = await this.getChatId(customerPhone);
    await this.client.sendMessage(chatId, message);
  }

  // Send driver found notification (CUSTOMER ONLY) - WITH PRICING
  async sendDriverFound(customerPhone, driverName, orderNumber) {
    const message = `✅ *DRIVER DITEMUKAN!*

👨‍💼 Driver Anda: *${driverName}*
📋 No. Pesanan: ${orderNumber}

📞 Driver akan segera menghubungi Anda.
⏱️ Estimasi waktu: 5-10 menit 🏍️`;

    const chatId = await this.getChatId(customerPhone);
    await this.client.sendMessage(chatId, message);
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

    const chatId = await this.getChatId(customerPhone);
    await this.client.sendMessage(chatId, message);
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

    const chatId = await this.getChatId(customerPhone);
    await this.client.sendMessage(chatId, message);
  }

  // Send queued confirmation (CUSTOMER ONLY)
  async sendQueuedConfirmation(customerPhone, orderNumber) {
    const message = `📝 *PESANAN MASUK ANTRIAN*

Pesanan Anda (${orderNumber}) telah masuk antrian.

✅ Kami akan segera mencarikan driver untuk Anda
📱 Anda akan diberitahu ketika driver sudah siap

Terima kasih atas kesabaran Anda! 🙏`;

    const chatId = await this.getChatId(customerPhone);
    await this.client.sendMessage(chatId, message);
  }

  // Send cancellation message (CUSTOMER ONLY)
  async sendCancellationMessage(customerPhone, orderNumber, reason) {
    const message = `❌ *PESANAN DIBATALKAN*

Mohon maaf, pesanan Anda telah dibatalkan.

📋 No. Pesanan: ${orderNumber}
📝 Alasan: ${reason}

💬 Silakan pesan kembali jika berminat. Ketik "pesan"`;

    const chatId = await this.getChatId(customerPhone);
    await this.client.sendMessage(chatId, message);
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