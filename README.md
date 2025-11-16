# 🚀 Kurir Kan Bot - WhatsApp Automation Bot

Bot WhatsApp profesional untuk mengelola bisnis jasa kurir dan ojek online secara otomatis. Sistem lengkap dengan manajemen driver, tracking orderan, antrian otomatis, dan dashboard admin real-time.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Fitur Utama

### 🎯 Untuk Customer
- ✅ Pesan langsung via WhatsApp (mudah & cepat)
- ✅ 2 Layanan: Pengiriman Barang & Ojek/Antar Jemput
- ✅ Form pemesanan otomatis terstruktur
- ✅ Notifikasi real-time status orderan
- ✅ Sistem antrian otomatis jika driver penuh
- ✅ Konfirmasi instant setelah pesan

### 👨‍💼 Untuk Driver
- ✅ Terima orderan otomatis via WhatsApp pribadi
- ✅ Sistem giliran adil (load balancing otomatis)
- ✅ Status On/Off Duty via grup WhatsApp
- ✅ Terima/tolak orderan mudah (ketik 1 atau 2)
- ✅ Update status orderan simpel
- ✅ Tracking orderan harian & total
- ✅ Notifikasi timeout 60 detik per orderan

### 🔧 Untuk Admin
- ✅ Dashboard real-time via WhatsApp
- ✅ Daftar driver dengan sistem token
- ✅ Suspend/Aktivasi driver
- ✅ Tracking setoran driver otomatis
- ✅ Laporan harian lengkap
- ✅ Monitor status semua driver
- ✅ Lihat orderan aktif & antrian
- ✅ 15+ command admin via chat
- ✅ Statistik lengkap (success rate, avg time, dll)

---

## 🎮 Cara Kerja Sistem
```
CUSTOMER → Pesan via WA → Bot Terima → Isi Form
                    ↓
          Bot Cari Driver Tersedia
                    ↓
     Driver Terima (60 detik timeout)
                    ↓
          Detail Orderan ke Driver
                    ↓
        Driver Antar → Selesai → Siap Terima Order Baru
```

**Load Balancing Otomatis:**
- Driver dengan orderan paling sedikit dapat prioritas
- Jika driver sibuk semua → masuk antrian otomatis
- Driver available → langsung assign dari antrian

---

## 💾 Arsitektur & Teknologi

### Tech Stack
- **Platform:** Node.js 16+
- **WhatsApp Library:** whatsapp-web.js
- **Storage:** In-Memory + JSON File (No Database!)
- **Auto-Save:** Setiap 5 menit
- **Auto-Cleanup:** Daily (3 AM)

### Kelebihan In-Memory Storage
✅ **Setup Super Cepat** - Tidak perlu install MongoDB/PostgreSQL  
✅ **Ringan** - RAM usage minimal (~50-100 MB)  
✅ **Portable** - Copy folder langsung jalan  
✅ **Zero Dependency** - Tidak perlu database eksternal  
✅ **Cocok untuk:** Traffic rendah-menengah (<500 orders/day)

### Keterbatasan
⚠️ Data di RAM (jika crash sebelum auto-save bisa hilang)  
⚠️ Tidak cocok traffic sangat tinggi (>1000 orders/day)  
⚠️ Tidak bisa scale horizontal (multiple instances)  
💡 **Solusi:** Untuk scale besar, ganti ke MongoDB/PostgreSQL

---

## 🛠️ Instalasi

### Prasyarat
- Node.js >= 16.0.0
- npm atau yarn
- Koneksi internet stabil
- Nomor WhatsApp untuk bot

### Langkah Instalasi

1. **Clone/Extract Source Code**
```bash
cd kurir-kan-bot
```

2. **Install Dependencies**
```bash
npm install
```

3. **Konfigurasi (Opsional)**
Edit file `config/config.js` untuk mengubah:
- Tarif pengiriman (default: Rp 7.000)
- Tarif ojek (default: Rp 10.000)
- Timeout driver response (default: 60 detik)

4. **Daftar Driver Pertama (Admin)**
```bash
npm run register-driver DRV001 "Nama Admin" "081234567890"
```
*Driver pertama otomatis jadi admin*

5. **Jalankan Bot**
```bash
npm start
```

6. **Scan QR Code**
Scan QR code yang muncul di terminal dengan WhatsApp bot Anda.

✅ **Bot Siap Digunakan!**

---

## 📱 Cara Penggunaan

### Setup Awal

#### 1. Buat Grup WhatsApp Driver
- Buat grup untuk semua driver
- Tambahkan bot ke grup
- Driver update status di grup ini

#### 2. Daftar Driver Baru (2 Cara)

**Cara 1: Via Command Line (Langsung)**
```bash
npm run register-driver DRV002 "Budi Santoso" "081234567890"
npm run register-driver DRV003 "Andi Wijaya" "081298765432"
```

**Cara 2: Via WhatsApp (Dengan Token - Lebih Aman)**

Admin chat bot:
```
/daftardriver 081234567890 Budi Santoso
```

Bot akan kirim token. Driver chat bot dengan nomor terdaftar:
```
/daftar [TOKEN]
```

#### 3. Update LID Driver (Penting!)

Jika driver tidak terdeteksi di grup, jalankan:
```bash
npm run detect-lid
```

Minta driver ketik "test" di grup. Copy LID yang muncul, lalu:
```bash
npm run update-lid DRV002 [LID]
```

---

### Penggunaan Harian

#### Customer
1. Chat bot WhatsApp
2. Ketik: `pesan` atau `menu`
3. Pilih layanan (1 atau 2)
4. Isi form yang dikirim bot
5. Tunggu driver

#### Driver

**Di Grup WhatsApp:**
```
On Duty    → Siap terima orderan
Off Duty   → Istirahat
Status     → Cek status semua driver
Queue      → Cek jumlah antrian
```

**Di Chat Pribadi dengan Bot:**
```
1 atau terima  → Terima orderan
2 atau tolak   → Tolak orderan
selesai        → Orderan selesai
batal          → Batalkan orderan
```

#### Admin

**Command Dashboard:**
```
/dashboard     → Dashboard real-time
/stats         → Statistik singkat
/report        → Laporan harian
/drivers       → List semua driver
/orders 20     → 20 orderan terakhir
/queue         → Cek antrian
```

**Command Manajemen Driver:**
```
/daftardriver 081xxx Nama      → Daftar driver baru
/suspend DRV002 Alasan         → Suspend driver
/aktifkan DRV002               → Aktifkan kembali
/setor DRV002 5000            → Catat setoran
/ceksetor                      → Cek setoran semua driver
```

**Command Sistem:**
```
/save    → Simpan data manual
/admin   → Bantuan lengkap
```

---

## 📊 Monitoring & Statistik

### Via Command Line

**Lihat Statistik Real-time:**
```bash
npm run stats
```

**Lihat Daftar Driver:**
```bash
npm run list-drivers
```

### Via WhatsApp (Admin)

Ketik `/dashboard` untuk melihat:
- Status semua driver (Siap/Sibuk/Istirahat)
- Orderan aktif & antrian
- Statistik harian (total, selesai, dibatalkan)
- Success rate & rata-rata waktu
- Update real-time

---

## 💰 Sistem Setoran Driver

### Default Setting
- Setoran wajib: **Rp 5.000/hari** (bisa diubah)
- Auto-suspend jika belum setor
- Auto-activate setelah setor

### Cara Catat Setoran
Admin ketik:
```
/setor DRV002 5000
```

Cek semua setoran:
```
/ceksetor
```

---

## 💾 Backup & Recovery

### Auto-Save
Data otomatis tersimpan setiap:
- ✅ 5 menit sekali
- ✅ Saat bot shutdown normal
- ✅ Setelah cleanup harian

File: `./data/storage.json`

### Backup Manual
```bash
# Linux/Mac
cp data/storage.json data/backup-$(date +%Y%m%d).json

# Windows
copy data\storage.json data\backup-%date:~-4,4%%date:~-7,2%%date:~-10,2%.json
```

### Restore
```bash
cp data/backup-YYYYMMDD.json data/storage.json
```

---

## 🔧 Maintenance

### Cleanup Otomatis
Bot otomatis:
- Reset statistik harian (jam 3 pagi)
- Hapus orderan lama (>30 hari)
- Save data setelah cleanup

### Manual Cleanup
Edit `app.js` untuk mengubah:
- Waktu cleanup (default: 3 AM)
- Hari penyimpanan (default: 30 hari)
- Interval auto-save (default: 5 menit)

---

## 🐳 Deploy dengan Docker
```dockerfile
# Build
docker build -t kurir-kan-bot .

# Run
docker run -d \
  --name kurir-bot \
  -v $(pwd)/data:/usr/src/app/data \
  -v $(pwd)/.wwebjs_auth:/usr/src/app/.wwebjs_auth \
  kurir-kan-bot
```

---

## 🔥 Deploy dengan PM2 (Production)
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs kurir-kan-bot

# Restart otomatis jam 3 pagi (sudah dikonfigurasi)
```

---

## 📁 Struktur Folder
```
kurir-kan-bot/
├── app.js                    # Main application
├── config/
│   └── config.js            # Konfigurasi (tarif, timeout, dll)
├── handlers/
│   ├── messageHandler.js    # Handler pesan
│   ├── formHandler.js       # Handler form
│   └── buttonHandler.js     # Handler tombol
├── services/
│   ├── orderService.js      # Logika orderan
│   ├── driverService.js     # Logika driver
│   ├── queueService.js      # Logika antrian
│   ├── notificationService.js # Notifikasi WA
│   ├── adminServices.js     # Fitur admin
│   └── analyticsService.js  # Statistik
├── storage/
│   └── inMemoryStorage.js   # Storage engine
├── utils/
│   ├── formatter.js         # Format data
│   ├── validator.js         # Validasi input
│   └── logger.js            # Logging
├── scripts/
│   ├── registerDriver.js    # Daftar driver
│   ├── listDrivers.js       # List driver
│   ├── detectLID.js         # Detect LID
│   └── showStats.js         # Statistik
├── data/
│   └── storage.json         # Data persistence
└── .wwebjs_auth/            # WhatsApp session
```

---

## 🔐 Keamanan

- ✅ Admin diidentifikasi via LID (bukan nomor)
- ✅ Token registrasi driver (24 jam, sekali pakai)
- ✅ Data terenkripsi di file JSON
- ✅ Session WhatsApp tersimpan lokal
- ⚠️ Jangan share file `.wwebjs_auth` & `storage.json`

---

## 🐛 Troubleshooting

### Bot tidak terima pesan grup
```bash
npm run detect-lid
# Minta driver ketik "test" di grup
npm run update-lid DRV002 [LID]
```

### Driver tidak dapat orderan
1. Pastikan driver sudah `On Duty` di grup
2. Cek LID driver sudah benar
3. Pastikan tidak disuspend: `/drivers`

### Data hilang setelah restart
- Data belum tersave → tunggu 5 menit atau `/save`
- File corrupt → restore dari backup

### Orderan stuck di antrian
- Pastikan ada driver `On Duty`
- Restart bot untuk re-process queue

---

## 🚀 Tips Optimasi

### Performa Terbaik
- **Driver:** 3-10 driver optimal
- **Orders:** <500 orders/day smooth
- **RAM:** Min 512 MB, Rekomendasi 1 GB
- **CPU:** 1 vCore cukup

### Untuk Traffic Tinggi
Jika >500 orders/day, upgrade ke:
- MongoDB untuk persistence
- Redis untuk queue
- Multiple bot instances
- Load balancer

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Complete order management
- ✅ Driver load balancing
- ✅ Admin dashboard
- ✅ Queue system
- ✅ Deposit tracking
- ✅ Auto-save & cleanup
- ✅ Multi-service (Pengiriman & Ojek)

---

## 🤝 Support

### Dokumentasi
- README ini
- Komentar di source code
- Command `/admin` untuk bantuan

### Kontak
- 💬 Issues: [GitHub Issues]
- 📧 Email: [Your Email]
- 💬 WhatsApp: [Your Number]

---

## 📄 License

MIT License - Lihat file [LICENSE](LICENSE)

---

## 🎯 Roadmap

### Coming Soon
- [ ] Web dashboard
- [ ] Export laporan PDF/Excel
- [ ] Rating driver
- [ ] Multi-payment gateway
- [ ] GPS tracking
- [ ] Push notification
- [ ] Multi-language support

---

## ⭐ Kontribusi

Contributions are welcome! Silakan:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

---

## 💡 FAQ

**Q: Apakah perlu database?**  
A: Tidak! Bot menggunakan in-memory storage dengan auto-save ke JSON.

**Q: Berapa biaya operasional?**  
A: Hanya VPS (mulai Rp 50k/bulan) atau bisa pakai PC/laptop 24/7.

**Q: Bisa untuk bisnis lain?**  
A: Ya! Cocok untuk: laundry, cleaning service, rental motor, catering, dll.

**Q: Butuh skill coding?**  
A: Untuk instalasi: tidak. Untuk custom: basic JavaScript.

**Q: Garansi?**  
A: Source code given as-is. Support via dokumentasi & issues.

---

<div align="center">

**🚀 Made with ❤️ for Courier Business**

*Star ⭐ repository ini jika bermanfaat!*

[Report Bug](https://github.com/yourrepo/issues) · [Request Feature](https://github.com/yourrepo/issues)

</div>
