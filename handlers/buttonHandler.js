// ============================================
// FILE: handlers/buttonHandler.js
// ============================================

class ButtonHandler {
  constructor(client, notificationService) {
    this.client = client;
    this.notification = notificationService;
  }

  // Handle button responses
  async handleButtonResponse(message) {
    const buttonId = message.selectedButtonId;
    const chatId = message.from;

    if (!buttonId) return false;

    try {
      // Service selection buttons
      if (buttonId === 'btn_pengiriman') {
        await this.notification.sendPengirimanForm(chatId);
        return true;
      }

      if (buttonId === 'btn_ojek') {
        await this.notification.sendOjekForm(chatId);
        return true;
      }

      // Driver action buttons
      if (buttonId.startsWith('accept_')) {
        const orderId = buttonId.replace('accept_', '');
        return { action: 'accept_order', orderId };
      }

      if (buttonId.startsWith('reject_')) {
        const orderId = buttonId.replace('reject_', '');
        return { action: 'reject_order', orderId };
      }

      // Order action buttons
      if (buttonId === 'complete_order') {
        return { action: 'complete_order' };
      }

      if (buttonId === 'cancel_order') {
        return { action: 'cancel_order' };
      }

      // Queue decision buttons
      if (buttonId === 'queue_yes') {
        return { action: 'queue_accept' };
      }

      if (buttonId === 'queue_no') {
        return { action: 'queue_reject' };
      }

      // New order button
      if (buttonId === 'new_order') {
        await this.notification.sendWelcome(chatId);
        return true;
      }

    } catch (error) {
      console.error('Error handling button response:', error);
      await this.client.sendMessage(
        chatId,
        '❌ Terjadi kesalahan. Silakan coba lagi.'
      );
    }

    return false;
  }

  // Parse button from list response
  parseListResponse(message) {
    if (!message.selectedRowId) return null;

    return {
      buttonId: message.selectedRowId,
      title: message.selectedRowTitle || ''
    };
  }
}

module.exports = ButtonHandler;