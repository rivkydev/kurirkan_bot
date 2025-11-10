// ============================================
// FILE: handlers/messageHandler.js - COMPLETE
// ============================================

const Validator = require('../utils/validator');
const Formatter = require('../utils/formatter');
const orderService = require('../services/orderService');
const driverService = require('../services/driverService');
const queueService = require('../services/queueService');
const adminService = require('../services/adminService');
const ButtonHandler = require('./buttonHandler');
const FormHandler = require('./formHandler');
const Order = require('../models/Order');

class MessageHandler {
  constructor(client, notificationService) {
    this.client = client;
    this.notification = notificationService;
    this.buttonHandler = new ButtonHandler(client, notificationService);
    this.formHandler = new FormHandler(client, notificationService);
    
    // Track user state
    this.userStates = new Map();
    
    // Timeout tracking untuk driver response
    this.driverTimeouts = new Map();
  }

  // Main message handler
  async handleMessage(message) {
    const chatId = message.from;
    const text = message.body?.trim() || '';
    const isGroup = message.from.endsWith('@g.us');

    console.log(`[${new Date().toISOString()}] Message from ${chatId}: ${text}`);

    // Check for admin commands first
    if (!isGroup && adminService.isAdmin(chatId)) {
      const adminResponse = await adminService.handleAdminCommand(text, chatId);
      if (adminResponse) {
        await this.client.sendMessage(chatId, adminResponse);
        return;
      }
    }

    // Handle button responses
    if (message.type === 'buttons_response' || message.selectedButtonId) {
      const buttonResult = await this.buttonHandler.handleButtonResponse(message);
      if (buttonResult === true) return;
      if (buttonResult && buttonResult.action) {
        await this.handleButtonAction(message, buttonResult);
        return;
      }
    }

    // Handle group messages (driver status updates)
    if (isGroup) {
      await this.handleGroupMessage(message);
      return;
    }

    // Handle private messages
    await this.handlePrivateMessage(message);
  }

  // Handle button actions
  async handleButtonAction(message, actionData) {
    const chatId = message.from;
    const { action, orderId } = actionData;

    const driver = await driverService.getDriverByPhone(chatId);

    switch (action) {
      case 'accept_order':
        if (driver) {
          await this.handleDriverAcceptOrder(driver, chatId, orderId);
        }
        break;

      case 'reject_order':
        if (driver) {
          await this.handleDriverRejectOrder(driver, chatId, orderId);
        }
        break;

      case 'complete_order':
        if (driver) {
          await this.handleDriverCompleteOrder(driver, chatId);
        }
        break;

      case 'cancel_order':
        if (driver) {
          await this.handleDriverCancelOrder(driver, chatId);
        }
        break;

      case 'queue_accept':
        await this.processQueueAcceptance(chatId);
        break;

      case 'queue_reject':
        await this.processQueueRejection(chatId);
        break;

      case 'new_order':
        await this.notification.sendWelcome(chatId, true);
        this.userStates.set(chatId, { step: 'waiting_service_choice' });
        break;

      case 'repeat_order':
        await this.handleRepeatOrder(chatId);
        break;

      case 'check_status':
        await this.handleCheckStatus(chatId);
        break;
    }
  }

  // Handle group messages (driver updates)
  async handleGroupMessage(message) {
    const text = message.body.trim().toLowerCase();
    const sender = message.author || message.from;

    try {
      const driver = await driverService.getDriverByPhone(sender);
      if (!driver) return;

      if (text === 'on duty' || text === 'onduty') {
        await driverService.updateDriverStatus(sender, 'On Duty');
        await this.client.sendMessage(
          message.from,
          `✅ Status ${driver.name}: *ON DUTY*\nSiap menerima orderan!`
        );
        await this.processQueue();
        
      } else if (text === 'off duty' || text === 'offduty') {
        if (driver.currentOrder) {
          await this.client.sendMessage(
            message.from,
            `⚠️ ${driver.name}, Anda masih memiliki orderan aktif. Selesaikan orderan terlebih dahulu.`
          );
        } else {
          await driverService.updateDriverStatus(sender, 'Off Duty');
          await this.client.sendMessage(
            message.from,
            `✅ Status ${driver.name}: *OFF DUTY*\nIstirahat dulu ya!`
          );
        }
        
      } else if (text === 'status') {
        const allDrivers = await driverService.getAllDriversStatus();
        let statusText = `📊 *STATUS SEMUA DRIVER*\n\n`;
        
        allDrivers.forEach(d => {
          const statusFormatted = Formatter.formatDriverStatus(d.status);
          statusText += `${statusFormatted} ${d.name}\n`;
          statusText += `   Orderan hari ini: ${d.todayOrders}\n`;
          statusText += `   Orderan saat ini: ${d.currentOrder}\n\n`;
        });

        await this.client.sendMessage(message.from, statusText);
        
      } else if (text === 'queue' || text === 'antrian') {
        const queueSize = await queueService.getQueueSize();
        await this.client.sendMessage(
          message.from,
          `📝 Jumlah orderan dalam antrian: *${queueSize}*`
        );
      }
      
    } catch (error) {
      console.error('Error handling group message:', error);
      await this.client.sendMessage(
        message.from,
        `❌ Error: ${Formatter.formatError(error.message)}`
      );
    }
  }

  // Handle private messages
  async handlePrivateMessage(message) {
    const chatId = message.from;
    const text = message.body.trim();
    
    const userState = this.userStates.get(chatId) || { step: 'idle' };

    try {
      const driver = await driverService.getDriverByPhone(chatId);
      
      if (driver) {
        await this.handleDriverMessage(message, driver);
      } else {
        await this.handleCustomerMessage(message, userState);
      }
      
    } catch (error) {
      console.error('Error handling private message:', error);
      await this.client.sendMessage(
        chatId,
        `❌ Terjadi kesalahan: ${Formatter.formatError(error.message)}\n\nSilakan coba lagi atau hubungi admin.`
      );
    }
  }

  // Handle customer messages
  async handleCustomerMessage(message, userState) {
    const chatId = message.from;
    const text = message.body.trim();

    switch (userState.step) {
      case 'idle':
        // Check if customer has previous orders
        const customerPhone = chatId.replace('@c.us', '');
        const lastOrder = await this.getCustomerLastOrder(customerPhone);
        
        if (lastOrder && lastOrder.status === 'DELIVERED') {
          // Repeat customer
          await this.notification.sendRepeatCustomerWelcome(chatId, lastOrder);
          this.userStates.set(chatId, { 
            step: 'waiting_repeat_customer_choice',
            lastOrder: lastOrder
          });
        } else {
          // New customer or has active order
          await this.notification.sendWelcome(chatId, false);
          this.userStates.set(chatId, { step: 'waiting_service_choice' });
        }
        break;

      case 'waiting_repeat_customer_choice':
        await this.handleRepeatCustomerChoice(chatId, text, userState);
        break;

      case 'waiting_service_choice':
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('pengiriman') || lowerText.includes('barang') || text === '1') {
          await this.notification.sendPengirimanForm(chatId);
          this.userStates.set(chatId, { step: 'waiting_pengiriman_form' });
          
        } else if (lowerText.includes('ojek') || lowerText.includes('antar jemput') || text === '2') {
          await this.notification.sendOjekForm(chatId);
          this.userStates.set(chatId, { step: 'waiting_ojek_form' });
          
        } else {
          await this.client.sendMessage(
            chatId,
            'Maaf, pilihan tidak valid. Silakan pilih:\n1. Pengiriman Barang\n2. Ojek'
          );
        }
        break;

      case 'waiting_pengiriman_form':
        if (this.formHandler.isFormSubmission(text)) {
          const order = await this.formHandler.handlePengirimanForm(chatId, text);
          if (order) {
            await this.tryAssignDriver(order);
            this.userStates.set(chatId, { step: 'idle' });
          }
        } else {
          await this.client.sendMessage(
            chatId,
            '⚠️ Format form tidak sesuai. Pastikan Anda mengisi semua field dengan format:\nNama Field: Isi\n\nSilakan coba lagi.'
          );
        }
        break;

      case 'waiting_ojek_form':
        if (this.formHandler.isFormSubmission(text)) {
          const order = await this.formHandler.handleOjekForm(chatId, text);
          if (order) {
            await this.tryAssignDriver(order);
            this.userStates.set(chatId, { step: 'idle' });
          }
        } else {
          await this.client.sendMessage(
            chatId,
            '⚠️ Format form tidak sesuai. Pastikan Anda mengisi semua field dengan format:\nNama Field: Isi\n\nSilakan coba lagi.'
          );
        }
        break;

      case 'waiting_queue_decision':
        await this.processQueueDecision(chatId, text, userState);
        break;

      default:
        await this.notification.sendWelcome(chatId, false);
        this.userStates.set(chatId, { step: 'waiting_service_choice' });
    }
  }

  // Handle repeat customer choice
  async handleRepeatCustomerChoice(chatId, text, userState) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('baru') || lowerText.includes('new') || text === '1') {
      await this.notification.sendWelcome(chatId, true);
      this.userStates.set(chatId, { step: 'waiting_service_choice' });
      
    } else if (lowerText.includes('ulangi') || lowerText.includes('repeat') || text === '2') {
      await this.handleRepeatOrder(chatId);
      
    } else if (lowerText.includes('status') || lowerText.includes('cek') || text === '3') {
      await this.handleCheckStatus(chatId);
      
    } else {
      await this.notification.sendWelcome(chatId, true);
      this.userStates.set(chatId, { step: 'waiting_service_choice' });
    }
  }

  // Get customer's last order
  async getCustomerLastOrder(customerPhone) {
    try {
      const order = await Order.findOne({
        'customer.phone': customerPhone
      }).sort({ createdAt: -1 }).limit(1);
      
      return order;
    } catch (error) {
      console.error('Error getting last order:', error);
      return null;
    }
  }

  // Handle repeat order
  async handleRepeatOrder(chatId) {
    const customerPhone = chatId.replace('@c.us', '');
    const lastOrder = await this.getCustomerLastOrder(customerPhone);
    
    if (!lastOrder) {
      await this.client.sendMessage(chatId, '❌ Tidak ada orderan sebelumnya.');
      await this.notification.sendWelcome(chatId, false);
      this.userStates.set(chatId, { step: 'waiting_service_choice' });
      return;
    }

    // Create new order with same data
    const customerData = {
      phone: customerPhone,
      name: lastOrder.customer.name,
      chatId: chatId
    };

    const orderData = lastOrder.orderType === 'Pengiriman' 
      ? lastOrder.pengiriman 
      : lastOrder.ojek;

    const newOrder = await orderService.createOrder(lastOrder.orderType, customerData, orderData);
    
    await this.client.sendMessage(
      chatId,
      `✅ *Order berhasil diulangi!*\n\nNo. Pesanan: ${newOrder.orderNumber}\nSama seperti: ${lastOrder.orderNumber}`
    );

    await this.tryAssignDriver(newOrder);
    this.userStates.set(chatId, { step: 'idle' });
  }

  // Handle check status
  async handleCheckStatus(chatId) {
    const customerPhone = chatId.replace('@c.us', '');
    
    // Get active orders
    const activeOrders = await Order.find({
      'customer.phone': customerPhone,
      status: { $in: ['NEW', 'AWAITING_DRIVER', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] }
    }).sort({ createdAt: -1 });

    if (activeOrders.length === 0) {
      await this.client.sendMessage(
        chatId,
        '📋 Tidak ada orderan aktif.\n\nIngin membuat order baru?'
      );
      await this.notification.sendWelcome(chatId, true);
      this.userStates.set(chatId, { step: 'waiting_service_choice' });
      return;
    }

    // Show all active orders
    for (const order of activeOrders) {
      await this.notification.sendOrderStatus(chatId, order);
    }
  }

  // Try to assign driver to order
  async tryAssignDriver(order) {
    const availableDrivers = await driverService.getAvailableDrivers();

    if (availableDrivers.length === 0) {
      await this.notification.sendQueueNotification(
        order.customer.chatId,
        order.orderNumber
      );
      
      this.userStates.set(order.customer.chatId, {
        step: 'waiting_queue_decision',
        orderId: order._id
      });
      
      return;
    }

    const driver = availableDrivers[0];
    await orderService.updateStatus(order._id, 'AWAITING_DRIVER');
    await this.sendOrderToDriverWithTimeout(driver, order);
  }

  // Send order to driver with timeout mechanism
  async sendOrderToDriverWithTimeout(driver, order, timeout = 60000) {
    const driverPhone = Formatter.formatPhoneForWA(driver.phone);
    
    await this.notification.sendOrderToDriver(driverPhone, order, timeout / 1000);

    const timeoutId = setTimeout(async () => {
      console.log(`Driver ${driver.name} tidak merespon orderan ${order.orderNumber}`);
      
      const currentOrder = await orderService.getOrderById(order._id);
      if (currentOrder.status === 'AWAITING_DRIVER') {
        await this.tryNextDriver(order);
      }
      
      this.driverTimeouts.delete(order._id.toString());
    }, timeout);

    this.driverTimeouts.set(order._id.toString(), {
      timeoutId,
      driverId: driver._id,
      orderNumber: order.orderNumber
    });
  }

  // Try next driver
  async tryNextDriver(order) {
    const availableDrivers = await driverService.getAvailableDrivers();

    if (availableDrivers.length === 0) {
      await queueService.addToQueue(order._id);
      await this.notification.sendQueuedConfirmation(
        order.customer.chatId,
        order.orderNumber
      );
      return;
    }

    const nextDriver = availableDrivers[0];
    await this.sendOrderToDriverWithTimeout(nextDriver, order);
  }

  // Handle driver messages
  async handleDriverMessage(message, driver) {
    const chatId = message.from;
    const text = message.body.trim().toLowerCase();

    if (text.includes('ambil') || text.includes('terima') || text.includes('✅') || text === '1') {
      await this.handleDriverAcceptOrder(driver, chatId);
      
    } else if (text.includes('tolak') || text.includes('❌') || text === '2') {
      await this.handleDriverRejectOrder(driver, chatId);
      
    } else if (text.includes('selesai') || text.includes('complete')) {
      await this.handleDriverCompleteOrder(driver, chatId);
      
    } else if (text.includes('batal') || text.includes('cancel')) {
      await this.handleDriverCancelOrder(driver, chatId);
      
    } else {
      await this.client.sendMessage(
        chatId,
        `Halo ${driver.name}! 👋\n\nGunakan perintah:\n- "On Duty" di grup untuk siap menerima orderan\n- "Off Duty" di grup untuk istirahat\n- "Selesai" untuk menyelesaikan orderan\n- "Batal" jika customer membatalkan`
      );
    }
  }

  // Handle driver accept order
  async handleDriverAcceptOrder(driver, chatId, orderId = null) {
    let foundOrderId = orderId;
    
    if (!foundOrderId) {
      for (const [oid, data] of this.driverTimeouts.entries()) {
        if (data.driverId.toString() === driver._id.toString()) {
          foundOrderId = oid;
          clearTimeout(data.timeoutId);
          this.driverTimeouts.delete(oid);
          break;
        }
      }
    }

    if (!foundOrderId) {
      await this.client.sendMessage(chatId, '❌ Tidak ada orderan yang menunggu konfirmasi.');
      return;
    }

    const order = await orderService.getOrderById(foundOrderId);
    
    await orderService.assignDriver(order._id, driver._id);
    await driverService.assignOrder(driver._id, order._id);

    const orderDetails = orderService.formatOrderDetails(order);
    await this.notification.sendOrderDetailsToDriver(chatId, orderDetails);

    await this.notification.sendDriverFound(
      order.customer.chatId,
      driver.name,
      order.orderNumber
    );

    await this.client.sendMessage(
      chatId,
      `✅ Orderan ${order.orderNumber} berhasil diambil!\n\nSelamat bekerja! 🏍️`
    );
  }

  // Handle driver reject order
  async handleDriverRejectOrder(driver, chatId, orderId = null) {
    let order = null;
    
    for (const [oid, data] of this.driverTimeouts.entries()) {
      if (data.driverId.toString() === driver._id.toString()) {
        clearTimeout(data.timeoutId);
        this.driverTimeouts.delete(oid);
        order = await orderService.getOrderById(oid);
        break;
      }
    }

    if (!order) {
      await this.client.sendMessage(chatId, '❌ Tidak ada orderan yang menunggu konfirmasi.');
      return;
    }

    await this.client.sendMessage(chatId, `Orderan ${order.orderNumber} ditolak.`);
    await this.tryNextDriver(order);
  }

  // Handle driver complete order
  async handleDriverCompleteOrder(driver, chatId) {
    if (!driver.currentOrder) {
      await this.client.sendMessage(chatId, '❌ Anda tidak memiliki orderan aktif.');
      return;
    }

    const order = await orderService.getOrderById(driver.currentOrder);
    
    await orderService.updateStatus(order._id, 'DELIVERED', 'Completed by driver');
    await driverService.releaseDriver(driver._id);

    await this.notification.sendCompletionMessage(
      order.customer.chatId,
      order.orderNumber,
      driver.name
    );

    await this.client.sendMessage(
      chatId,
      `✅ Orderan ${order.orderNumber} selesai!\n\nTerima kasih! Anda sudah siap menerima orderan baru.`
    );

    await this.processQueue();
  }

  // Handle driver cancel order
  async handleDriverCancelOrder(driver, chatId) {
    if (!driver.currentOrder) {
      await this.client.sendMessage(chatId, '❌ Anda tidak memiliki orderan aktif.');
      return;
    }

    const order = await orderService.getOrderById(driver.currentOrder);
    const reason = 'Dibatalkan oleh customer (via driver)';
    
    await orderService.cancelOrder(order._id, reason);
    await driverService.releaseDriver(driver._id);

    await this.notification.sendCancellationMessage(
      order.customer.chatId,
      order.orderNumber,
      reason
    );

    await this.client.sendMessage(
      chatId,
      `Orderan ${order.orderNumber} dibatalkan.\n\nAnda sudah siap menerima orderan baru.`
    );

    await this.processQueue();
  }

  // Process queue acceptance
  async processQueueAcceptance(chatId) {
    const userState = this.userStates.get(chatId);
    if (!userState || !userState.orderId) return;

    await queueService.addToQueue(userState.orderId);
    
    const order = await orderService.getOrderById(userState.orderId);
    await this.notification.sendQueuedConfirmation(chatId, order.orderNumber);
    
    this.userStates.set(chatId, { step: 'idle' });
  }

  // Process queue rejection
  async processQueueRejection(chatId) {
    const userState = this.userStates.get(chatId);
    if (!userState || !userState.orderId) return;

    await orderService.cancelOrder(userState.orderId, 'Dibatalkan oleh customer - tidak ada driver');
    
    await this.client.sendMessage(
      chatId,
      '❌ Pesanan dibatalkan.\n\nSilakan pesan lagi nanti. Terima kasih!'
    );

    this.userStates.set(chatId, { step: 'idle' });
  }

  // Process queue decision (text-based fallback)
  async processQueueDecision(chatId, text, userState) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('ya') || lowerText.includes('iya') || text === '1') {
      await this.processQueueAcceptance(chatId);
    } else {
      await this.processQueueRejection(chatId);
    }
  }

  // Process queue when driver becomes available
  async processQueue() {
    const queueItem = await queueService.getNextOrder();
    
    if (!queueItem) return;

    const availableDrivers = await driverService.getAvailableDrivers();
    
    if (availableDrivers.length === 0) return;

    await queueService.removeFromQueue(queueItem._id);

    const driver = availableDrivers[0];
    const order = queueItem.order;

    await this.sendOrderToDriverWithTimeout(driver, order);

    await this.client.sendMessage(
      order.customer.chatId,
      `✅ Driver ditemukan untuk pesanan Anda (${order.orderNumber})!\n\nDriver akan segera menghubungi Anda.`
    );
  }
}

module.exports = MessageHandler;