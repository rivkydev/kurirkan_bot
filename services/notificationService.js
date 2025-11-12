// ============================================
// FILE: services/notificationService.js
// ============================================
const { Buttons } = require('whatsapp-web.js');


class NotificationService {
  constructor(client) {
    this.client = client;
  }

  // GANTI FUNGSI LAMA ANDA DENGAN YANG INI
  async sendButtons(to, text, buttons) {
    try {
      // Buat objek tombol menggunakan kelas Buttons
      const buttonMessage = new Buttons(
        text, // Body
        buttons.map((btn, idx) => ({ // Buttons
          id: btn.id || `btn_${idx}`,
          body: btn.text
        })),
        null, // Title (opsional, bisa null)
        'Kurir Kan - Layanan Kurir Terpercaya' // Footer
      );

      await this.client.sendMessage(to, buttonMessage);

    } catch (error) {
      console.error('Error sending buttons:', error);
      // Fallback: send text with numbered options
      let fallbackText = text + '\n\n';
      buttons.forEach((btn, idx) => {
        fallbackText += `${idx + 1}. ${btn.text}\n`;
      });
      fallbackText += '\nBalas dengan nomor pilihan Anda.';
      await this.client.sendMessage(to, fallbackText);
    }
  }

  // Send welcome message
  async sendWelcome(to) {
    await this.sendButtons(
      to,
      'Halo! Selamat datang di *Kurir Kan*\n\nSilakan pilih layanan yang Anda butuhkan:',
      [
        { id: 'btn_pengiriman', text: '📦 Pengiriman Barang' },
        { id: 'btn_ojek', text: '🏍️ Ojek/Antar Jemput' }
      ]
    );
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

  // Send order to driver
  async sendOrderToDriver(driverPhone, order, timeout = 60) {
    const message = `🔔 *ORDERAN BARU*

Hai! Ada orderan baru nih, mau ambil?

No. Pesanan: *${order.orderNumber}*
Jenis: ${order.orderType}

⏰ Respon dalam ${timeout} detik`;

    await this.sendButtons(
      driverPhone,
      message,
      [
        { id: 'accept_' + order._id, text: '✅ Ambil Orderan' },
        { id: 'reject_' + order._id, text: '❌ Tolak' }
      ]
    );
  }

  // Send order details to driver
  async sendOrderDetailsToDriver(driverPhone, orderDetails) {
    await this.client.sendMessage(driverPhone, orderDetails);
    
    // Send action buttons
    const buttons = [
      { id: 'complete_order', text: '✅ Selesai' },
      { id: 'cancel_order', text: '❌ Dibatalkan Customer' }
    ];

    await this.sendButtons(
      driverPhone,
      'Pilih aksi untuk orderan ini:',
      buttons
    );
  }

  // Send order confirmation to customer
  async sendOrderConfirmation(customerPhone, orderNumber) {
    const message = `✅ *PESANAN DITERIMA*

Terima kasih! Pesanan Anda telah kami terima.

No. Pesanan: *${orderNumber}*

Kami sedang mencarikan driver untuk Anda.
Mohon tunggu sebentar...`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send driver found notification
  async sendDriverFound(customerPhone, driverName, orderNumber) {
    const message = `✅ *DRIVER DITEMUKAN!*

Driver Anda: *${driverName}*
No. Pesanan: ${orderNumber}

Driver akan segera menghubungi Anda.
Estimasi waktu: 5-10 menit`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send completion message to customer
  async sendCompletionMessage(customerPhone, orderNumber, driverName) {
    const message = `✅ *PESANAN SELESAI*

Terima kasih telah menggunakan layanan *Kurir Kan*!

No. Pesanan: ${orderNumber}
Driver Anda: ${driverName}
Status: Terkirim ✓

Ingin pesan lagi? Ketik /order atau pilih menu di bawah.`;

    await this.sendButtons(
      customerPhone,
      message,
      [{ id: 'new_order', text: '📦 Order Baru' }]
    );
  }

  // Send queue notification
  async sendQueueNotification(customerPhone, orderNumber) {
    const message = `⚠️ *DRIVER SEDANG TIDAK TERSEDIA*

Saat ini semua driver sedang mengantarkan pesanan.

Apakah Anda ingin tetap membuat pesanan? Kami akan mencarikan driver segera setelah ada yang tersedia.

No. Pesanan: ${orderNumber}`;

    await this.sendButtons(
      customerPhone,
      message,
      [
        { id: 'queue_yes', text: '✅ Ya, Tetap Pesan' },
        { id: 'queue_no', text: '❌ Batal' }
      ]
    );
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

Silakan pesan kembali jika berminat.`;

    await this.client.sendMessage(customerPhone, message);
  }
}

module.exports = NotificationService;