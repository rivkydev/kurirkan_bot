const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const storage = require('../storage/inMemoryStorage');

class WebServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, { cors: { origin: '*' } });
    this.latestQR = null;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  setWhatsAppClient(client) {
    this.waClient = client;
  }

  setupRoutes() {
    // API Drivers
    this.app.get('/api/drivers', (req, res) => {
      res.json(storage.getAllDrivers());
    });

    this.app.post('/api/drivers', (req, res) => {
      const { name, phone } = req.body;
      if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
      
      // Normalisasi nomor: +62 / 62 / 08 -> simpan as 08...
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);

      // Generate token aktivasi — driver harus ketik AKTIVASI <token> di grup
      const token = storage.generateRegistrationToken(cleanPhone, name);
      res.json({ success: true, name, phone: cleanPhone, token });
    });


    this.app.delete('/api/drivers/:id', (req, res) => {
      const driverId = req.params.id;
      try {
        storage.suspendDriver(driverId, 'Deleted from Web Dashboard');
        res.json({ success: true, message: 'Driver suspended/deleted' });
      } catch (err) {
        res.status(404).json({ error: err.message });
      }
    });

    // API Orders
    this.app.get('/api/orders', (req, res) => {
      // Return all orders, newest first
      const allOrders = Array.from(storage.orders.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(allOrders);
    });

    this.app.get('/api/orders/active', (req, res) => {
      res.json(storage.getActiveOrders());
    });

    this.app.delete('/api/orders/:id', (req, res) => {
      try {
        storage.cancelOrder(req.params.id, 'Cancelled from Web Dashboard');
        res.json({ success: true, message: 'Order cancelled' });
      } catch (err) {
        res.status(404).json({ error: err.message });
      }
    });
    
    // API Queue
    this.app.get('/api/orders/queue', (req, res) => {
      res.json(storage.getQueue());
    });

    // API Stats
    this.app.get('/api/stats', (req, res) => {
      const stats = storage.getDailyStats();
      const drivers = storage.getAllDrivers();
      res.json({
        ...stats,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'On Duty' || d.status === 'Busy').length,
        queue: storage.getQueue().length,
        botConnected: storage.isBotConnected
      });
    });

    // API Config
    this.app.get('/api/config', (req, res) => {
      res.json(storage.config);
    });

    this.app.post('/api/config', (req, res) => {
      const { is24Hours, openTime, closeTime, attendanceGroups } = req.body;
      storage.config = {
        ...storage.config,
        is24Hours: Boolean(is24Hours),
        openTime: openTime || '08:00',
        closeTime: closeTime || '22:00',
        attendanceGroups: Array.isArray(attendanceGroups) ? attendanceGroups : []
      };
      storage.saveToFile();
      res.json({ success: true, config: storage.config });
    });

    // API Groups
    this.app.get('/api/groups', (req, res) => {
      try {
        const adminGroups = [];
        const knownGroups = storage.config.knownGroups || {};
        
        // Loop semua grup yang udah terekam saat ada aktivitas chat
        for (const [id, name] of Object.entries(knownGroups)) {
          adminGroups.push({ id, name });
        }
        
        res.json(adminGroups);
      } catch (err) {
        console.error('[DEBUG] /api/groups 500 Error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // API Create Group
    this.app.post('/api/create-group', async (req, res) => {
      if (!this.waClient) return res.status(503).json({ error: 'Bot belum terhubung ke WhatsApp' });
      
      const { groupName, participants } = req.body;
      if (!groupName) return res.status(400).json({ error: 'Nama grup wajib diisi' });

      try {
        // Format nomor HP ke format WA: 08xxx -> 628xxx@c.us
        const formattedParticipants = (participants || []).map(p => {
          let num = p.replace(/[^0-9]/g, ''); // hapus semua non-angka
          if (num.startsWith('0')) num = '62' + num.slice(1);
          if (!num.startsWith('62')) num = '62' + num;
          return num + '@c.us';
        });

        console.log(`📦 Creating group: ${groupName} with participants:`, formattedParticipants);
        
        const result = await this.waClient.createGroup(groupName, formattedParticipants);
        const groupId = result.gid._serialized;

        // Pastikan izin grup memperbolehkan semua user untuk mengirim pesan
        try {
          const chat = await this.waClient.getChatById(groupId);
          if (chat.isGroup) {
            await chat.setMessagesAdminsOnly(false); // false = all participants can send message
          }
        } catch (e) {
          console.error('Gagal mengatur izin kirim pesan grup:', e);
        }

        // Catat ke knownGroups (Bot otomatis jadi admin karena dia yang buat grupnya)
        storage.addKnownGroup(groupId, groupName);

        res.json({ success: true, groupId, groupName });
      } catch (err) {
        console.error('❌ Gagal bikin grup:', err);
        res.status(500).json({ error: err.message });
      }
    });
  }

  setupSocket() {
    this.io.on('connection', (socket) => {
      console.log('🌐 Web client connected to Socket.io');
      if (storage.isBotConnected) {
        socket.emit('status', { message: 'WhatsApp Bot Connected', isConnected: true });
        socket.emit('ready', { message: 'Ready' });
      } else {
        socket.emit('status', { message: 'Web Dashboard Connected (Waiting for WA)', isConnected: false });
        if (this.latestQR) {
            socket.emit('qr', this.latestQR);
        }
      }
    });
  }

  emitQR(qr) {
    this.latestQR = qr;
    this.io.emit('qr', qr);
  }

  emitReady(info) {
    this.latestQR = null;
    this.io.emit('ready', info);
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🌍 Web Dashboard running at http://localhost:${this.port}`);
    });
  }
}

module.exports = new WebServer();
