const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  orderType: {
    type: String,
    enum: ['Pengiriman', 'Ojek'],
    required: true
  },
  status: {
    type: String,
    enum: ['NEW', 'AWAITING_DRIVER', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    default: 'NEW'
  },
  customer: {
    phone: String,
    name: String,
    chatId: String
  },
  
  // Data untuk Pengiriman
  pengiriman: {
    namaPengirim: String,
    nomorHpPengirim: String,
    lokasiPengambilan: String,
    namaToko: String,
    deskripsiPesanan: String,
    namaPenerima: String,
    nomorHpPenerima: String,
    lokasiPengantaran: String,
    waktuDiinginkan: String,
    metodePembayaran: String,
    catatanTambahan: String
  },
  
  // Data untuk Ojek
  ojek: {
    namaPenumpang: String,
    nomorHp: String,
    lokasiJemput: String,
    patokanjemput: String,
    lokasiTujuan: String,
    patokanTujuan: String,
    jumlahPenumpang: Number,
    waktuJemput: String,
    metodePembayaran: String,
    catatanTambahan: String
  },
  
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  
  assignedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  
  timeline: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate nomor pesanan
orderSchema.statics.generateOrderNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const todayOrders = await this.countDocuments({
    orderNumber: new RegExp(`^KRK-${dateStr}`)
  });
  
  const sequence = String(todayOrders + 1).padStart(3, '0');
  return `KRK-${dateStr}-${sequence}`;
};

// Add timeline entry
orderSchema.methods.addTimeline = function(status, note = '') {
  this.timeline.push({
    status,
    timestamp: new Date(),
    note
  });
};

module.exports = mongoose.model('Order', orderSchema);