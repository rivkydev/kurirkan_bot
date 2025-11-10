// ============================================
// FILE: services/notificationService.js - ENHANCED
// ============================================

const config = require('../config/config');
const driverService = require('./driverService');

class NotificationService {
  constructor(client) {
    this.client = client;
  }

  // Send message with buttons
  async sendButtons(to, text, buttons) {
    try {
      const buttonMessage = {
        text: text,
        buttons: buttons.map((btn, idx) => ({
          id: btn.id || `btn_${idx}`,
          body: btn.text
        })),
        footer: 'Kurir Kan - Layanan Kurir Terpercaya'
      };

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

  // Get driver availability info
  async getDriverAvailabilityInfo() {
    const availableDrivers = await driverService.getAvailableDrivers();
    
    if (availableDrivers.length === 0) {
      return '⚠️ _Semua driver sedang sibuk. Pesanan akan masuk antrian._';
    }

    if (availableDrivers.length === 1) {
      return '✅ _1 driver siap melayani Anda._';
    }

    return `✅ _${availableDrivers.length} driver siap melayani Anda._`;
  }

  // Send welcome message with driver info
  async sendWelcome(to, isRepeatCustomer = false) {
    const driverInfo = config.features.showDriverInfoOnWelcome 
      ? await this.getDriverAvailabilityInfo() 
      : '';

    const greeting = isRepeatCustomer 
      ? 'Selamat datang kembali! 👋' 
      : 'Halo! Selamat datang di *Kurir Kan* 👋';

    const message = `${greeting}\n\n${driverInfo}\n\nSilakan pilih layanan yang Anda butuhkan:`;

    await this.sendButtons(
      to,
      message,
      [
        { id: 'btn_pengiriman', text: '📦 Pengiriman Barang' },
        { id: 'btn_ojek', text: '🏍️ Ojek/Antar Jemput' }
      ]
    );
  }

  // Send welcome for repeat customer with quick options
  async sendRepeatCustomerWelcome(to, lastOrder) {
    const driverInfo = await this.getDriverAvailabilityInfo();
    
    const message = `Selamat datang kembali! 👋\n\n${driverInfo}\n\nOrderan terakhir Anda: *${lastOrder.orderNumber}*\n${lastOrder.orderType}\n\nSilakan pilih:`;

    await this.sendButtons(
      to,
      message,
      [
        { id: 'btn_new_order', text: '📦 Order Baru' },
        { id: 'btn_repeat_order', text: '🔄 Ulangi Order Sebelumnya' },
        { id: 'btn_check_status', text: '📋 Cek Status Order' }
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
    const estimatedTime = config.features.showEstimatedTime 
      ? '\nEstimasi waktu: 5-10 menit' 
      : '';

    const message = `✅ *DRIVER DITEMUKAN!*

Driver Anda: *${driverName}*
No. Pesanan: ${orderNumber}

Driver akan segera menghubungi Anda.${estimatedTime}`;

    await this.client.sendMessage(customerPhone, message);
  }

  // Send completion message to customer
  async sendCompletionMessage(customerPhone, orderNumber, driverName) {
    const message = `✅ *PESANAN SELESAI*

Terima kasih telah menggunakan layanan *Kurir Kan*!

No. Pesanan: ${orderNumber}
Driver Anda: ${driverName}
Status: Terkirim ✓

Ingin pesan lagi? Ketik pesan apapun untuk order baru.`;

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

  // Send order status
  async sendOrderStatus(customerPhone, order) {
    const Order = require('../models/Order');
    const Formatter = require('../utils/formatter');
    
    let message = `📋 *STATUS PESANAN*\n\n`;
    message += `No. Pesanan: *${order.orderNumber}*\n`;
    message += `Status: ${Formatter.formatOrderStatus(order.status)}\n`;
    message += `Jenis: ${order.orderType}\n\n`;

    if (order.assignedDriver) {
      message += `Driver: ${order.assignedDriver.name}\n`;
    }

    message += `\n*Timeline:*\n`;
    message += Formatter.formatTimeline(order.timeline);

    await this.client.sendMessage(customerPhone, message);
  }
}

module.exports = NotificationService;