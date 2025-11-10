// ============================================
// FILE: services/orderService.js (IN-MEMORY)
// ============================================

const storage = require('../storage/inMemoryStorage');

class OrderService {
  createOrder(orderType, customerData, orderData) {
    return storage.createOrder(orderType, customerData, orderData);
  }

  assignDriver(orderNumber, driverId) {
    return storage.assignDriver(orderNumber, driverId);
  }

  updateStatus(orderNumber, status, note = '') {
    return storage.updateOrderStatus(orderNumber, status, note);
  }

  cancelOrder(orderNumber, reason) {
    return storage.cancelOrder(orderNumber, reason);
  }

  getOrderByNumber(orderNumber) {
    return storage.getOrder(orderNumber);
  }

  getOrderById(orderNumber) {
    return storage.getOrder(orderNumber);
  }

  formatOrderDetails(order) {
    let details = `📋 *DETAIL ORDERAN*\n\n`;
    details += `No. Pesanan: *${order.orderNumber}*\n`;
    details += `Jenis: ${order.orderType}\n\n`;

    if (order.orderType === 'Pengiriman') {
      const p = order.pengiriman;
      details += `*PENGIRIM:*\n`;
      details += `Nama: ${p.namaPengirim}\n`;
      details += `HP: ${p.nomorHpPengirim}\n`;
      details += `Lokasi: ${p.lokasiPengambilan}\n`;
      if (p.namaToko) details += `Toko: ${p.namaToko}\n`;
      
      details += `\n*PENERIMA:*\n`;
      details += `Nama: ${p.namaPenerima}\n`;
      details += `HP: ${p.nomorHpPenerima}\n`;
      details += `Lokasi: ${p.lokasiPengantaran}\n`;
      
      details += `\n*PESANAN:*\n${p.deskripsiPesanan}\n`;
      details += `\n*INFO LAINNYA:*\n`;
      details += `Waktu: ${p.waktuDiinginkan}\n`;
      details += `Pembayaran: ${p.metodePembayaran}\n`;
      if (p.catatanTambahan) details += `Catatan: ${p.catatanTambahan}\n`;
      
    } else if (order.orderType === 'Ojek') {
      const o = order.ojek;
      details += `*PENUMPANG:*\n`;
      details += `Nama: ${o.namaPenumpang}\n`;
      details += `HP: ${o.nomorHp}\n`;
      details += `Jumlah: ${o.jumlahPenumpang} orang\n`;
      
      details += `\n*LOKASI JEMPUT:*\n${o.lokasiJemput}\n`;
      if (o.patokanJemput) details += `Patokan: ${o.patokanJemput}\n`;
      
      details += `\n*LOKASI TUJUAN:*\n${o.lokasiTujuan}\n`;
      if (o.patokanTujuan) details += `Patokan: ${o.patokanTujuan}\n`;
      
      details += `\n*INFO LAINNYA:*\n`;
      details += `Waktu Jemput: ${o.waktuJemput}\n`;
      details += `Pembayaran: ${o.metodePembayaran}\n`;
      if (o.catatanTambahan) details += `Catatan: ${o.catatanTambahan}\n`;
    }

    return details;
  }

  getActiveOrdersCount() {
    return storage.getActiveOrders().length;
  }
}

module.exports = new OrderService();