// ============================================
// FILE: scripts/detectLID.js
// ============================================

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔍 Detecting WhatsApp LID...\n');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'kurir-kan-bot'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('📱 Scan QR Code (if needed):');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ Bot connected!\n');
  console.log('📋 Waiting for group messages...\n');
  console.log('👉 Silakan kirim pesan "test" di grup untuk detect LID Anda\n');
});

client.on('message', async (message) => {
  const isGroup = message.from.endsWith('@g.us');
  
  if (!isGroup) return;
  
  const sender = message.author || message.from;
  const text = message.body.trim().toLowerCase();
  
  if (text === 'test') {
    console.log('\n✅ LID DETECTED!\n');
    console.log('═══════════════════════════════════════');
    console.log(`Sender ID: ${sender}`);
    console.log(`Message from: ${message.from}`);
    console.log(`Body: ${message.body}`);
    console.log('═══════════════════════════════════════\n');
    
    // Extract clean LID
    const cleanLID = sender.replace('@lid', '').replace('@s.whatsapp.net', '').replace('@c.us', '');
    
    console.log('📝 REGISTER DRIVER COMMAND:\n');
    console.log(`npm run register-driver DRV001 "Muhammad Rivky" "${cleanLID}"`);
    console.log('\n');
    
    await client.sendMessage(
      message.from,
      `✅ LID terdeteksi!\n\nYour LID: ${cleanLID}\n\nGunakan command di terminal untuk register.`
    );
    
    console.log('✅ Done! Press Ctrl+C to exit.');
  } else {
    console.log(`[${new Date().toISOString()}] Message from ${sender}: ${message.body}`);
  }
});

client.initialize();