// ============================================
// FILE: services/orderService.js
// ============================================

const Order = require('../models/Order');
const Driver = require('../models/Driver');

class OrderService {
  // Create new order
  async createOrder(orderType, customerData, orderData) {
    const orderNumber = await Order.generateOrderNumber();
    
    const order = new Order({
      orderNumber,
      orderType,
      customer: customerData,
      status: 'NEW'
    });

    if (orderType === 'Pengiriman') {
      order.pengiriman = orderData;
    } else if (orderType === 'Ojek') {
      order.ojek = orderData;
    }

    order.addTimeline('NEW', 'Order created');
    await order.save();

    return order;
  }

  // Assign driver to order
  async assignDriver(orderId, driverId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    order.assignedDriver = driverId;
    order.status = 'ASSIGNED';
    order.assignedAt = new Date();
    order.addTimeline('ASSIGNED', `Assigned to driver ${driverId}`);
    
    await order.save();
    return order;
  }

  // Update order status
  async updateStatus(orderId, status, note = '') {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    
    if (status === 'DELIVERED') {
      order.completedAt = new Date();
    } else if (status === 'CANCELLED') {
      order.cancelledAt = new Date();
    }

    order.addTimeline(status, note);
    await order.save();

    return order;
  }

  // Cancel order
  async cancelOrder(orderId, reason) {
    const order = await Order.findById(orderId).populate('assignedDriver');
    if (!order) throw new Error('Order not found');

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.addTimeline('CANCELLED', reason);
    
    await order.save();

    return order;
  }

  // Get order by number
  async getOrderByNumber(orderNumber) {
    return await Order.findOne({ orderNumber }).populate('assignedDriver');
  }

  // Get order by ID
  async getOrderById(orderId) {
    return await Order.findById(orderId).populate('assignedDriver');
  }

  // Format order details for display
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
      
      details += `\n*PESANAN:*\n`;
      details += `${p.deskripsiPesanan}\n`;
      
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
      
      details += `\n*LOKASI JEMPUT:*\n`;
      details += `${o.lokasiJemput}\n`;
      if (o.patokanJemput) details += `Patokan: ${o.patokanJemput}\n`;
      
      details += `\n*LOKASI TUJUAN:*\n`;
      details += `${o.lokasiTujuan}\n`;
      if (o.patokanTujuan) details += `Patokan: ${o.patokanTujuan}\n`;
      
      details += `\n*INFO LAINNYA:*\n`;
      details += `Waktu Jemput: ${o.waktuJemput}\n`;
      details += `Pembayaran: ${o.metodePembayaran}\n`;
      if (o.catatanTambahan) details += `Catatan: ${o.catatanTambahan}\n`;
    }

    return details;
  }

  // Get active orders count
  async getActiveOrdersCount() {
    return await Order.countDocuments({
      status: { $in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] }
    });
  }
}

module.exports = new OrderService();