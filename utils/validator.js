// ============================================
// FILE: utils/validator.js
// ============================================

class Validator {
  static validatePhone(phone) {
    // Format: 08xxx atau 628xxx
    const phoneRegex = /^(08|628)\d{8,12}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  static normalizePhone(phone) {
    let normalized = phone.replace(/[\s-]/g, '');
    if (normalized.startsWith('08')) {
      normalized = '62' + normalized.slice(1);
    }
    return normalized + '@c.us';
  }

  static validateAddress(address) {
    return address && address.length >= 10;
  }

  static validatePaymentMethod(method) {
    const validMethods = ['COD', 'Transfer', 'E-wallet', 'E-Wallet', 'Ewallet'];
    return validMethods.some(m => m.toLowerCase() === method.toLowerCase());
  }

  static validateTime(time) {
    if (time.toLowerCase() === 'asap') return true;
    
    // Format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static parsePengirimanForm(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const data = {};
    
    const fieldMappings = {
      'nama pengirim': 'namaPengirim',
      'nomor hp pengirim': 'nomorHpPengirim',
      'lokasi pengambilan': 'lokasiPengambilan',
      'nama toko': 'namaToko',
      'deskripsi pesanan': 'deskripsiPesanan',
      'nama penerima': 'namaPenerima',
      'nomor hp penerima': 'nomorHpPenerima',
      'lokasi pengantaran': 'lokasiPengantaran',
      'waktu pengantaran': 'waktuDiinginkan',
      'waktu diinginkan': 'waktuDiinginkan',
      'metode pembayaran': 'metodePembayaran',
      'catatan tambahan': 'catatanTambahan'
    };

    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      
      if (fieldMappings[key]) {
        data[fieldMappings[key]] = value;
      }
    });

    return data;
  }

  static parseOjekForm(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const data = {};
    
    const fieldMappings = {
      'nama penumpang': 'namaPenumpang',
      'nomor hp penumpang': 'nomorHp',
      'nomor hp': 'nomorHp',
      'lokasi jemput': 'lokasiJemput',
      'patokan lokasi jemput': 'patokanJemput',
      'catatan lokasi jemput': 'patokanJemput',
      'lokasi tujuan': 'lokasiTujuan',
      'patokan lokasi tujuan': 'patokanTujuan',
      'catatan lokasi tujuan': 'patokanTujuan',
      'jumlah penumpang': 'jumlahPenumpang',
      'waktu jemput': 'waktuJemput',
      'metode pembayaran': 'metodePembayaran',
      'catatan tambahan': 'catatanTambahan'
    };

    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      
      if (fieldMappings[key]) {
        if (key.includes('jumlah')) {
          data[fieldMappings[key]] = parseInt(value) || 1;
        } else {
          data[fieldMappings[key]] = value;
        }
      }
    });

    return data;
  }

  static validatePengirimanData(data) {
    const required = [
      'namaPengirim', 'nomorHpPengirim', 'lokasiPengambilan',
      'deskripsiPesanan', 'namaPenerima', 'nomorHpPenerima',
      'lokasiPengantaran', 'waktuDiinginkan', 'metodePembayaran'
    ];

    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        message: `Field berikut belum diisi: ${missing.join(', ')}`
      };
    }

    if (!this.validatePhone(data.nomorHpPengirim)) {
      return { valid: false, message: 'Format nomor HP pengirim tidak valid' };
    }

    if (!this.validatePhone(data.nomorHpPenerima)) {
      return { valid: false, message: 'Format nomor HP penerima tidak valid' };
    }

    if (!this.validateAddress(data.lokasiPengambilan)) {
      return { valid: false, message: 'Lokasi pengambilan terlalu singkat' };
    }

    if (!this.validateAddress(data.lokasiPengantaran)) {
      return { valid: false, message: 'Lokasi pengantaran terlalu singkat' };
    }

    return { valid: true };
  }

  static validateOjekData(data) {
    const required = [
      'namaPenumpang', 'nomorHp', 'lokasiJemput',
      'lokasiTujuan', 'jumlahPenumpang', 'waktuJemput',
      'metodePembayaran'
    ];

    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        message: `Field berikut belum diisi: ${missing.join(', ')}`
      };
    }

    if (!this.validatePhone(data.nomorHp)) {
      return { valid: false, message: 'Format nomor HP tidak valid' };
    }

    if (!this.validateAddress(data.lokasiJemput)) {
      return { valid: false, message: 'Lokasi jemput terlalu singkat' };
    }

    if (!this.validateAddress(data.lokasiTujuan)) {
      return { valid: false, message: 'Lokasi tujuan terlalu singkat' };
    }

    return { valid: true };
  }
}

module.exports = Validator;