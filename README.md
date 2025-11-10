# 🚀 Kurir Kan - Bot WhatsApp untuk Layanan Kurir

Bot WhatsApp otomatis untuk mengelola orderan kurir dengan sistem driver management dan antrian.

## 📋 Fitur

- ✅ Order Pengiriman Barang
- ✅ Order Ojek/Antar Jemput
- ✅ Sistem Driver On/Off Duty
- ✅ Auto-assign driver ke orderan
- ✅ Sistem antrian jika driver tidak tersedia
- ✅ Timeout otomatis untuk respons driver
- ✅ Tracking status orderan
- ✅ Notifikasi otomatis ke customer & driver

## 🛠️ Instalasi

### 1. Requirements
- Node.js v16 atau lebih baru
- MongoDB
- WhatsApp di smartphone

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi Anda
```

### 4. Jalankan Bot

```bash
npm start
```

Scan QR Code yang muncul dengan WhatsApp Anda.

## 👨‍💼 Manajemen Driver

### Daftar Driver Baru

```bash
npm run register-driver DRV001 "John Doe" "081234567890"
```

### Lihat Daftar Driver

```bash
npm run list-drivers
```

## 📱 Cara Pakai

### Untuk Customer:

1. Kirim pesan apapun ke bot
2. Pilih layanan (Pengiriman/Ojek)
3. Isi form yang diberikan
4. Tunggu driver dikonfirmasi
5. Driver akan menghubungi Anda

### Untuk Driver:

**Di Grup Driver:**
- Kirim "On Duty" untuk siap menerima orderan
- Kirim "Off Duty" untuk istirahat
- Kirim "status" untuk melihat status semua driver
- Kirim "queue" untuk melihat antrian orderan

**Di Chat Pribadi dengan Bot:**
- Terima orderan dengan tombol "✅ Ambil Orderan"
- Tolak orderan dengan tombol "❌ Tolak"
- Setelah ambil orderan, bot kirim detail lengkap
- Kirim "Selesai" setelah orderan diantar
- Kirim "Batal" jika customer membatalkan

## 📂 Struktur Folder

```
kurir-kan-bot/
├── config/
│   └── config.js           # Konfigurasi aplikasi
├── models/
│   ├── Driver.js           # Model driver
│   ├── Order.js            # Model orderan
│   └── Queue.js            # Model antrian
├── services/
│   ├── driverService.js    # Logic driver
│   ├── orderService.js     # Logic orderan
│   ├── queueService.js     # Logic antrian
│   └── notificationService.js  # Logic notifikasi
├── handlers/
│   └── messageHandler.js   # Handler pesan
├── utils/
│   └── validator.js        # Validasi input
├── scripts/
│   ├── registerDriver.js   # Script daftar driver
│   └── listDrivers.js      # Script list driver
├── app.js                  # Main application
├── package.json
├── .env.example
└── README.md
```

## 🔄 Flow Orderan

```
Customer kirim pesan → Pilih layanan → Isi form
    ↓
Bot validasi form → Generate nomor pesanan
    ↓
Bot cari driver available
    ↓
    ├─ Ada driver → Kirim notif ke driver (timeout 60 detik)
    │       ↓
    │   Driver terima → Assign orderan → Kirim detail
    │       ↓
    │   Driver selesaikan → Notif customer → Driver available lagi
    │
    └─ Tidak ada driver → Tawarkan antrian
            ↓
        Customer setuju → Masuk queue
            ↓
        Driver available → Auto assign dari queue
```

## 🐛 Troubleshooting

### Bot tidak bisa connect ke WhatsApp
- Pastikan WhatsApp Web bisa dibuka di browser
- Hapus folder `.wwebjs_auth` dan scan ulang QR

### Database error
- Pastikan MongoDB running
- Cek MONGO_URL di .env

### Driver tidak menerima notif
- Pastikan driver sudah terdaftar dengan nomor yang benar
- Format nomor: 628xxx atau 08xxx

## 📝 License

MIT License - bebas digunakan dan dimodifikasi

## 👨‍💻 Support

Jika ada pertanyaan atau butuh bantuan, silakan buat issue di repository ini.
```