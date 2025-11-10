# 🚀 Kurir Kan Bot (In-Memory Version)

Bot WhatsApp tanpa database eksternal. Semua data disimpan di memori (RAM) dengan auto-save ke file JSON.

## ✨ Kelebihan In-Memory Storage

✅ **Setup Super Cepat** - Tidak perlu install MongoDB/PostgreSQL
✅ **Ringan** - Konsumsi resource minimal
✅ **Portable** - Tinggal copy folder, langsung jalan
✅ **Cocok untuk** - Prototype, testing, traffic rendah-menengah

## ⚠️ Keterbatasan

❌ Data hilang jika bot crash sebelum auto-save
❌ Tidak cocok untuk traffic sangat tinggi (>1000 orders/day)
❌ Tidak bisa scale horizontal (multiple instances)

## 🛠️ Instalasi

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Daftar Driver

\`\`\`bash
npm run register-driver DRV001 "Budi Santoso" "081234567890"
npm run register-driver DRV002 "Andi Wijaya" "081298765432"
\`\`\`

### 3. Jalankan Bot

\`\`\`bash
npm start
\`\`\`

Scan QR Code yang muncul.

## 📊 Monitoring

### Lihat Statistik

\`\`\`bash
npm run stats
\`\`\`

### Lihat Driver

\`\`\`bash
npm run list-drivers
\`\`\`

## 💾 Data Persistence

Data otomatis disimpan setiap:
- ✅ 5 menit sekali (auto-save)
- ✅ Saat bot shutdown normal
- ✅ Setelah cleanup harian

File disimpan di: \`./data/storage.json\`

## 🔄 Backup Manual

Cukup copy file \`storage.json\`:

\`\`\`bash
cp data/storage.json data/backup-$(date +%Y%m%d).json
\`\`\`

## 📝 License

MIT License