// ============================================
// FILE: utils/messageSender.js
// Human-like message sending to avoid WA spam detection
// ============================================

/**
 * Kirim pesan dengan simulasi "mengetik" dan delay acak
 * agar bot tidak terdeteksi sebagai spam/bot oleh WhatsApp.
 */
async function sendWithDelay(client, chatId, text, options = {}) {
    try {
        const chat = await client.getChatById(chatId);

        // Simulasi "mengetik..."
        await chat.sendStateTyping();

        // Delay realistis: ~3 karakter/detik, min 0.8s, max 4s
        const baseDelay = Math.min(text.length * 30, 4000);
        const jitter = Math.random() * 1000;
        const totalDelay = Math.max(800, baseDelay) + jitter;

        await sleep(totalDelay);

        // Hentikan indikator mengetik
        await chat.clearState();

        // Kirim pesan
        await client.sendMessage(chatId, text, options);

    } catch (err) {
        // Fallback langsung kirim jika typing simulation gagal
        // WA Web kadang melempar error "r" jika chat belum fully synced di UI
        await sleep(800 + Math.random() * 500);
        await client.sendMessage(chatId, text, options);
    }
}

/**
 * Delay antar pesan agar tidak burst
 */
async function interMessageDelay() {
    const delay = 500 + Math.random() * 1500;
    await sleep(delay);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sendWithDelay, interMessageDelay, sleep };
