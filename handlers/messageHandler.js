const Validator = require('../utils/validator');
const orderService = require('../services/orderService');
const driverService = require('../services/driverService');
const queueService = require('../services/queueService');

class MessageHandler {
  constructor(client, notificationService) {
    this.client = client;
    this.notification = notificationService;
    
    // Track user state
    this.userStates = new Map();
    
    // Timeout tracking untuk driver response
    this.driverTimeouts = new Map();
  }

  // Main message handler
  async handleMessage(message) {
    const chatId = message.from;
    const text = message.body.trim();
    const isGroup = message.from.endsWith('@g.us');

    console.log(`[${new Date().toISOString()}] Message from ${chatId}: ${text}`);

    // Handle group messages (driver status updates)
    if (isGroup) {
      await this.handleGroupMessage(message);
      return;
    }

    // Handle private messages
    await this.handlePrivateMessage(message);
  }

  // Handle group messages (driver updates)
  async handleGroupMessage(message) {
    const text = message.body.trim().toLowerCase();
    const sender = message.author || message.from;

    try {
      // Normalize phone (remove @c.us dan @s.whatsapp.net)
      const senderPhone = sender.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '');
      
      // Check if driver exists
      const driver = await driverService.getDriverByPhone(senderPhone);
      if (!driver) {
        console.log(`❌ Sender ${senderPhone} is not a registered driver`);
        return;
      }

      console.log(`✅ Driver found: ${driver.name}`);

      // Status updates
      if (text === 'on duty') {
        await driverService.updateDriverStatus(senderPhone, 'On Duty');
        await this.client.sendMessage(
          message.from,
          `✅ Status ${driver.name}: *ON DUTY*\nSiap menerima orderan! 🏍️`
        );

        // Check if there's queue
        await this.processQueue();
        
      } else if (text === 'off duty') {
        if (driver.currentOrder) {
          await this.client.sendMessage(
            message.from,
            `⚠️ ${driver.name}, Anda masih memiliki orderan aktif. Selesaikan orderan terlebih dahulu.`
          );
        } else {
          await driverService.updateDriverStatus(senderPhone, 'Off Duty');
          await this.client.sendMessage(
            message.from,
            `✅ Status ${driver.name}: *OFF DUTY*\nIstirahat dulu ya! 😴`
          );
        }
        
      } else if (text === 'status') {
        const allDrivers = await driverService.getAllDriversStatus();
        let statusText = `📊 *STATUS SEMUA DRIVER*\n\n`;
        
        allDrivers.forEach(d => {
          const statusEmoji = d.status === 'On Duty' ? '🟢' : d.status === 'Busy' ? '🔴' : '⚪';
          statusText += `${statusEmoji} ${d.name}: ${d.status}\n`;
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
        `❌ Error: ${error.message}`
      );
    }
  }

  // Handle private messages
  async handlePrivateMessage(message) {
    const chatId = message.from;
    const text = message.body.trim();
    
    // Normalize phone untuk cek driver
    const senderPhone = chatId.replace('@c.us', '');
    
    // Get user state
    const userState = this.userStates.get(chatId) || { step: 'idle' };

    try {
      // Check if this is a driver
      const driver = await driverService.getDriverByPhone(senderPhone);
      
      if (driver) {
        // This is a driver
        await this.handleDriverMessage(message, driver);
      } else {
        // This is a customer
        await this.handleCustomerMessage(message, userState);
      }
      
    } catch (error) {
      console.error('Error handling private message:', error);
      await this.client.sendMessage(
        chatId,
        `❌ Terjadi kesalahan: ${error.message}\n\nSilakan coba lagi atau hubungi admin.`
      );
    }
  }

  // Handle customer messages
  async handleCustomerMessage(message, userState) {
    const chatId = message.from;
    const text = message.body.trim();
    const lowerText = text.toLowerCase();

    if (lowerText === 'pesan' || lowerText === 'menu' || lowerText === '/start' || lowerText === 'order') {
      await this.notification.sendWelcome(chatId);
      this.userStates.set(chatId, { step: 'waiting_service_choice' });
      return;
    }

    switch (userState.step) {
      case 'idle':
        await this.notification.sendWelcome(chatId);
        this.userStates.set(chatId, { step: 'waiting_service_choice' });
        break;

      case 'waiting_service_choice':
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
        await this.processPengirimanForm(chatId, text);
        break;

      case 'waiting_ojek_form':
        await this.processOjekForm(chatId, text);
        break;

      case 'waiting_queue_decision':
        await this.processQueueDecision(chatId, text, userState);
        break;

      default:
        await this.notification.sendWelcome(chatId);
        this.userStates.set(chatId, { step: 'waiting_service_choice' });
    }
  }

  // Process pengiriman form
  async processPengirimanForm(chatId, text) {
    const formData = Validator.parsePengirimanForm(text);
    const validation = Validator.validatePengirimanData(formData);
    
    if (!validation.valid) {
      await this.client.sendMessage(
        chatId,
        `❌ *Form tidak valid*\n\n${validation.message}\n\nSilakan isi ulang form dengan lengkap.`
      );
      await this.notification.sendPengirimanForm(chatId);
      return;
    }

    const customerData = {
      phone: chatId.replace('@c.us', ''),
      name: formData.namaPengirim,
      chatId: chatId
    };

    const order = await orderService.createOrder('Pengiriman', customerData, formData);
    await this.notification.sendOrderConfirmation(chatId, order.orderNumber);
    await this.tryAssignDriver(order);
    this.userStates.set(chatId, { step: 'idle' });
  }

  // Process ojek form
  async processOjekForm(chatId, text) {
    const formData = Validator.parseOjekForm(text);
    const validation = Validator.validateOjekData(formData);
    
    if (!validation.valid) {
      await this.client.sendMessage(
        chatId,
        `❌ *Form tidak valid*\n\n${validation.message}\n\nSilakan isi ulang form dengan lengkap.`
      );
      await this.notification.sendOjekForm(chatId);
      return;
    }

    const customerData = {
      phone: chatId.replace('@c.us', ''),
      name: formData.namaPenumpang,
      chatId: chatId
    };

    const order = await orderService.createOrder('Ojek', customerData, formData);
    await this.notification.sendOrderConfirmation(chatId, order.orderNumber);
    await this.tryAssignDriver(order);
    this.userStates.set(chatId, { step: 'idle' });
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
        orderId: order.orderNumber
      });
      
      return;
    }

    const driver = availableDrivers[0];
    await orderService.updateStatus(order.orderNumber, 'AWAITING_DRIVER');
    await this.sendOrderToDriverWithTimeout(driver, order);
  }

  // Send order to driver with timeout mechanism
  async sendOrderToDriverWithTimeout(driver, order, timeout = 60000) {
    console.log(`📤 Sending order ${order.orderNumber} to driver ${driver.name} (${driver.phone})`);
    
    // Send notification (phone sudah dalam format 62xxx tanpa @c.us)
    await this.notification.sendOrderToDriver(driver.phone, order, timeout / 1000);

    const timeoutId = setTimeout(async () => {
      console.log(`⏰ Driver ${driver.name} tidak merespon orderan ${order.orderNumber}`);
      
      const currentOrder = await orderService.getOrderByNumber(order.orderNumber);
      if (currentOrder.status === 'AWAITING_DRIVER') {
        await this.tryNextDriver(order);
      }
      
      this.driverTimeouts.delete(order.orderNumber);
    }, timeout);

    this.driverTimeouts.set(order.orderNumber, {
      timeoutId,
      driverId: driver.driverId,
      orderNumber: order.orderNumber
    });
  }

  // Try next driver
  async tryNextDriver(order) {
    const availableDrivers = await driverService.getAvailableDrivers();

    if (availableDrivers.length === 0) {
      await queueService.addToQueue(order.orderNumber);
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

    if (text.includes('terima') || text.includes('ambil') || text === '1') {
      await this.handleDriverAcceptOrder(driver, chatId);
      
    } else if (text.includes('tolak') || text === '2') {
      await this.handleDriverRejectOrder(driver, chatId);
      
    } else if (text.includes('selesai') || text.includes('complete')) {
      await this.handleDriverCompleteOrder(driver, chatId);
      
    } else if (text.includes('batal') || text.includes('cancel')) {
      await this.handleDriverCancelOrder(driver, chatId);
      
    } else {
      await this.client.sendMessage(
        chatId,
        `Halo ${driver.name}! 👋\n\nGunakan perintah:\n- "On Duty" di grup untuk siap menerima orderan\n- "Off Duty" di grup untuk istirahat`
      );
    }
  }

  // Handle driver accept order
  async handleDriverAcceptOrder(driver, chatId) {
    let orderId = null;
    
    for (const [oid, data] of this.driverTimeouts.entries()) {
      if (data.driverId === driver.driverId) {
        orderId = oid;
        clearTimeout(data.timeoutId);
        this.driverTimeouts.delete(oid);
        break;
      }
    }

    if (!orderId) {
      await this.client.sendMessage(chatId, '❌ Tidak ada orderan yang menunggu konfirmasi.');
      return;
    }

    const order = await orderService.getOrderByNumber(orderId);
    await orderService.assignDriver(order.orderNumber, driver.driverId);
    await driverService.assignOrder(driver.driverId, order.orderNumber);

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
  async handleDriverRejectOrder(driver, chatId) {
    let order = null;
    
    for (const [oid, data] of this.driverTimeouts.entries()) {
      if (data.driverId === driver.driverId) {
        clearTimeout(data.timeoutId);
        this.driverTimeouts.delete(oid);
        order = await orderService.getOrderByNumber(oid);
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

    const order = await orderService.getOrderByNumber(driver.currentOrder);
    await orderService.updateStatus(order.orderNumber, 'DELIVERED', 'Completed by driver');
    await driverService.releaseDriver(driver.driverId);
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

    const order = await orderService.getOrderByNumber(driver.currentOrder);
    const reason = 'Dibatalkan oleh customer (via driver)';
    
    await orderService.cancelOrder(order.orderNumber, reason);
    await driverService.releaseDriver(driver.driverId);
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

  // Process queue decision
  async processQueueDecision(chatId, text, userState) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('ya') || lowerText.includes('iya') || text === '1') {
      await queueService.addToQueue(userState.orderId);
      const order = await orderService.getOrderByNumber(userState.orderId);
      await this.notification.sendQueuedConfirmation(chatId, order.orderNumber);
      
    } else {
      await orderService.cancelOrder(userState.orderId, 'Dibatalkan oleh customer - tidak ada driver');
      await this.client.sendMessage(
        chatId,
        '❌ Pesanan dibatalkan.\n\nSilakan pesan lagi nanti. Terima kasih!'
      );
    }

    this.userStates.set(chatId, { step: 'idle' });
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