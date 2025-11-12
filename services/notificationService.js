// ============================================
// FILE: services/notificationService.js (FIXED)
// ============================================

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

  // Send welcome message
  async sendWelcome(to) {
    const text = `Halo! Selamat datang di *Kurir Kan* 🚀

Silakan pilih layanan yang Anda butuhkan:

1. 📦 Pengiriman Barang
2. 🏍️ Ojek/Antar Jemput

_Balas dengan nomor pilihan (1 atau 2)_`;
    
    await this.client.sendMessage(to, text);
  }

  // Send pengiriman form
  async sendPengirimanForm(to) {
    const formText = `📋 *FORM PEMESANAN PENGIRIMAN*

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

  // Send ojek form
  async sendOjekForm(to) {
    const formText = `📋 *FORM PEMESANAN OJEK*

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

  // Send order to driver (FIXED)
  async sendOrderToDriver(driverPhone, order, timeout = 60) {
    try {
      // PERBAIKAN: Gunakan chatId asli driver, jangan normalize
      const driver = require('../storage/inMemoryStorage').getDriverByPhone(driverPhone.replace('@c.us', ''));
      
      if (!driver) {
        console.error('❌ Driver not found:', driverPhone);
        return;
      }

      const message = `🔔 *ORDERAN BARU*

Hai ${driver.name}! Ada orderan baru nih, mau ambil?

No. Pesanan: *${order.orderNumber}*
Jenis: ${order.orderType}

⏰ Respon dalam ${timeout} detik

Balas:
1. ✅ Terima Orderan
2. ❌ Tolak`;

      // Kirim ke chatId driver yang sebenarnya
      await this.client.sendMessage(driver.phone + '@c.us', message);
      
      console.log(`✅ Order ${order.orderNumber} sent to driver ${driver.name} (${driver.phone})`);
      
    } catch (error) {
      console.error('Error sending order to driver:', error);
    }
  }

  // Send order details to driver
  async sendOrderDetailsToDriver(driverPhone, orderDetails) {
    try {
      await this.client.sendMessage(driverPhone, orderDetails);
      
      const actionText = `\n_Setelah selesai, kirim:_
- "selesai" untuk menyelesaikan orderan
- "batal" untuk membatalkan orderan`;
      
      await this.client.sendMessage(driverPhone, actionText);
      
    } catch (error) {
      console.error('Error sending order details:', error);
    }
  }

  // Send order confirmation to customer
  async sendOrderConfirmation(customerPhone, orderNumber) {
    const message = `✅ *PESANAN DITERIMA*

Terima kasih! Pesanan Anda telah kami terima.

No. Pesanan: *${orderNumber}*

Kami sedang mencarikan driver untuk Anda.
Mohon tunggu sebentar... ⏳`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send driver found notification
  async sendDriverFound(customerPhone, driverName, orderNumber) {
    const message = `✅ *DRIVER DITEMUKAN!*

Driver Anda: *${driverName}*
No. Pesanan: ${orderNumber}

Driver akan segera menghubungi Anda.
Estimasi waktu: 5-10 menit 🏍️`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send completion message to customer
  async sendCompletionMessage(customerPhone, orderNumber, driverName) {
    const message = `✅ *PESANAN SELESAI*

Terima kasih telah menggunakan layanan *Kurir Kan*! 🎉

No. Pesanan: ${orderNumber}
Driver Anda: ${driverName}
Status: Terkirim ✓

Ingin pesan lagi? Ketik "pesan"`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send queue notification
  async sendQueueNotification(customerPhone, orderNumber) {
    const message = `⚠️ *DRIVER SEDANG TIDAK TERSEDIA*

Saat ini semua driver sedang mengantarkan pesanan.

Apakah Anda ingin tetap membuat pesanan? Kami akan mencarikan driver segera setelah ada yang tersedia.

No. Pesanan: ${orderNumber}

Balas:
1. ✅ Ya, Tetap Pesan
2. ❌ Batal`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send queued confirmation
  async sendQueuedConfirmation(customerPhone, orderNumber) {
    const message = `📝 *PESANAN MASUK ANTRIAN*

Pesanan Anda (${orderNumber}) telah masuk antrian.

Kami akan segera mencarikan driver untuk Anda dan akan memberitahu ketika driver sudah siap.

Terima kasih atas kesabaran Anda! 🙏`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send cancellation message
  async sendCancellationMessage(customerPhone, orderNumber, reason) {
    const message = `❌ *PESANAN DIBATALKAN*

Mohon maaf, pesanan Anda telah dibatalkan.

No. Pesanan: ${orderNumber}
Alasan: ${reason}

Silakan pesan kembali jika berminat. Ketik "pesan"`;

    await this.client.sendMessage(customerPhone, message);
  }
}

module.exports = NotificationService;