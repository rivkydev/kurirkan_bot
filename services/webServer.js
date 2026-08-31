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

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  setupRoutes() {
    // API Drivers
    this.app.get('/api/drivers', (req, res) => {
      res.json(storage.getAllDrivers());
    });

    this.app.post('/api/drivers', (req, res) => {
      const { name, phone } = req.body;
      if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
      const driverId = `DRV${String(storage.drivers.size + 1).padStart(3, '0')}`;
      const driver = storage.addDriver(driverId, name, phone);
      res.json(driver);
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
  }

  setupSocket() {
    this.io.on('connection', (socket) => {
      console.log('🌐 Web client connected to Socket.io');
      if (storage.isBotConnected) {
        socket.emit('status', { message: 'WhatsApp Bot Connected', isConnected: true });
        socket.emit('ready', { message: 'Ready' });
      } else {
        socket.emit('status', { message: 'Web Dashboard Connected (Waiting for WA)', isConnected: false });
      }
    });
  }

  emitQR(qr) {
    this.io.emit('qr', qr);
  }

  emitReady(info) {
    this.io.emit('ready', info);
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🌍 Web Dashboard running at http://localhost:${this.port}`);
    });
  }
}

module.exports = new WebServer();
