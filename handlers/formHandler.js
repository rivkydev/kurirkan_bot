// ============================================
// FILE: handlers/formHandler.js
// ============================================

const Validator = require('../utils/validator');
const orderService = require('../services/orderService');

class FormHandler {
  constructor(client, notificationService) {
    this.client = client;
    this.notification = notificationService;
  }

  // Parse and validate pengiriman form
  async handlePengirimanForm(chatId, text) {
    try {
      // Parse form data
      const formData = Validator.parsePengirimanForm(text);
      
      // Validate data
      const validation = Validator.validatePengirimanData(formData);
      
      if (!validation.valid) {
        await this.sendFormError(chatId, validation.message, 'pengiriman');
        return null;
      }

      // Create customer data
      const customerData = {
        phone: chatId.replace('@c.us', ''),
        name: formData.namaPengirim,
        chatId: chatId
      };

      // Create order
      const order = await orderService.createOrder('Pengiriman', customerData, formData);
      
      // Send confirmation
      await this.notification.sendOrderConfirmation(chatId, order.orderNumber);

      return order;
      
    } catch (error) {
      console.error('Error handling pengiriman form:', error);
      await this.client.sendMessage(
        chatId,
        '❌ Terjadi kesalahan saat memproses form. Silakan coba lagi.'
      );
      return null;
    }
  }

  // Parse and validate ojek form
  async handleOjekForm(chatId, text) {
    try {
      // Parse form data
      const formData = Validator.parseOjekForm(text);
      
      // Validate data
      const validation = Validator.validateOjekData(formData);
      
      if (!validation.valid) {
        await this.sendFormError(chatId, validation.message, 'ojek');
        return null;
      }

      // Create customer data
      const customerData = {
        phone: chatId.replace('@c.us', ''),
        name: formData.namaPenumpang,
        chatId: chatId
      };

      // Create order
      const order = await orderService.createOrder('Ojek', customerData, formData);
      
      // Send confirmation
      await this.notification.sendOrderConfirmation(chatId, order.orderNumber);

      return order;
      
    } catch (error) {
      console.error('Error handling ojek form:', error);
      await this.client.sendMessage(
        chatId,
        '❌ Terjadi kesalahan saat memproses form. Silakan coba lagi.'
      );
      return null;
    }
  }

  // Send form error message
  async sendFormError(chatId, errorMessage, formType) {
    const message = `❌ *Form Tidak Valid*\n\n${errorMessage}\n\nSilakan isi ulang form dengan lengkap dan benar.`;
    
    await this.client.sendMessage(chatId, message);

    // Resend form
    if (formType === 'pengiriman') {
      await this.notification.sendPengirimanForm(chatId);
    } else if (formType === 'ojek') {
      await this.notification.sendOjekForm(chatId);
    }
  }

  // Preview form data before submission
  formatFormPreview(formData, formType) {
    let preview = '📋 *Preview Data Anda:*\n\n';

    if (formType === 'pengiriman') {
      preview += `👤 Pengirim: ${formData.namaPengirim}\n`;
      preview += `📱 HP: ${formData.nomorHpPengirim}\n`;
      preview += `📍 Dari: ${formData.lokasiPengambilan}\n`;
      if (formData.namaToko) preview += `🏪 Toko: ${formData.namaToko}\n`;
      preview += `📦 Pesanan: ${formData.deskripsiPesanan}\n\n`;
      
      preview += `👤 Penerima: ${formData.namaPenerima}\n`;
      preview += `📱 HP: ${formData.nomorHpPenerima}\n`;
      preview += `📍 Ke: ${formData.lokasiPengantaran}\n\n`;
      
      preview += `⏰ Waktu: ${formData.waktuDiinginkan}\n`;
      preview += `💳 Pembayaran: ${formData.metodePembayaran}\n`;
      if (formData.catatanTambahan) {
        preview += `📝 Catatan: ${formData.catatanTambahan}\n`;
      }
    } else if (formType === 'ojek') {
      preview += `👤 Penumpang: ${formData.namaPenumpang}\n`;
      preview += `📱 HP: ${formData.nomorHp}\n`;
      preview += `👥 Jumlah: ${formData.jumlahPenumpang} orang\n\n`;
      
      preview += `📍 Jemput: ${formData.lokasiJemput}\n`;
      if (formData.patokanJemput) {
        preview += `   Patokan: ${formData.patokanJemput}\n`;
      }
      
      preview += `📍 Tujuan: ${formData.lokasiTujuan}\n`;
      if (formData.patokanTujuan) {
        preview += `   Patokan: ${formData.patokanTujuan}\n`;
      }
      
      preview += `\n⏰ Waktu Jemput: ${formData.waktuJemput}\n`;
      preview += `💳 Pembayaran: ${formData.metodePembayaran}\n`;
      if (formData.catatanTambahan) {
        preview += `📝 Catatan: ${formData.catatanTambahan}\n`;
      }
    }

    return preview;
  }

  // Check if message looks like a form submission
  isFormSubmission(text) {
    // Check if text contains form-like structure
    const lines = text.split('\n').filter(l => l.trim());
    
    // Must have at least 5 lines with colons
    const linesWithColons = lines.filter(l => l.includes(':')).length;
    
    return linesWithColons >= 5;
  }

  // Detect form type from content
  detectFormType(text) {
    const lowerText = text.toLowerCase();
    
    // Check for pengiriman keywords
    const pengirimanKeywords = ['pengirim', 'penerima', 'pengambilan', 'pengantaran', 'toko', 'pesanan'];
    const pengirimanCount = pengirimanKeywords.filter(k => lowerText.includes(k)).length;
    
    // Check for ojek keywords
    const ojekKeywords = ['penumpang', 'jemput', 'tujuan', 'patokan'];
    const ojekCount = ojekKeywords.filter(k => lowerText.includes(k)).length;
    
    if (pengirimanCount >= 3) return 'pengiriman';
    if (ojekCount >= 2) return 'ojek';
    
    return null;
  }
}

module.exports = FormHandler;