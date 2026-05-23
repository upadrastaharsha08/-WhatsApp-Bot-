// ════════════════════════════════════════════════
//   RUTVIK AI — Ultimate WhatsApp Bot v2.0
//   Features:
//   ✅ 3-key Claude API rotation
//   ✅ Rate limit detection & cooldown
//   ✅ Message queue (no dropped messages)
//   ✅ Anti-ban typing simulation
//   ✅ Admin dashboard via WhatsApp commands
//   ✅ Per-user conversation memory
//   ✅ Railway deployment ready
// ════════════════════════════════════════════════

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { getRutvikReply } = require('./claude');
const { enqueue } = require('./queue');
const { simulateTyping } = require('./typing');
const { clearHistory } = require('./memory');
const { isAdmin, handleAdminCommand } = require('./admin');

const ENABLE_GROUPS = process.env.ENABLE_GROUP_CHAT === 'true';

// ── WhatsApp Client ───────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: process.env.SESSION_NAME || 'rutvik-session',
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

client.on('qr', (qr) => {
  console.log('\n🕉️  RUTVIK AI — Ultimate WhatsApp Bot v2.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 Scan QR with WhatsApp → Linked Devices → Link a Device\n');
  qrcode.generate(qr, { small: false }); // bigger QR
  console.log('\n⏳ Waiting for scan...\n');
  console.log('📋 QR STRING (paste at https://webqr.com if camera scan fails):');
  console.log(qr); // raw string as backup
});

// ── Auth Events ───────────────────────────────────
client.on('authenticated', () => {
  console.log('✅ Authenticated! Session saved — no re-scan on restart.\n');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
  console.error('👉 Delete .wwebjs_auth/ folder and restart.\n');
});

// ── Ready ─────────────────────────────────────────
client.on('ready', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🕉️  RUTVIK AI Ultimate Bot is LIVE!');
  console.log('🌸 Listening for messages...');
  console.log('🔑 Multi-key rotation: ACTIVE');
  console.log('📬 Message queue: ACTIVE');
  console.log('🛡️  Anti-ban delays: ACTIVE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// ── Disconnected ──────────────────────────────────
client.on('disconnected', (reason) => {
  console.warn('⚠️  Disconnected:', reason, '— Reconnecting...');
  setTimeout(() => client.initialize(), 5000);
});

// ── Message Handler ───────────────────────────────
client.on('message', async (message) => {
  try {
    // Skip broadcasts
    if (message.from === 'status@broadcast') return;

    // Skip self messages
    if (message.fromMe) return;

    // Skip groups unless enabled
    if (message.isGroupMsg && !ENABLE_GROUPS) return;

    const messageText = message.body?.trim();
    if (!messageText) return;

    const phone = message.from;
    const senderNum = phone.replace('@c.us', '');

    console.log(`[MSG] ${senderNum}: "${messageText.slice(0, 60)}${messageText.length > 60 ? '...' : ''}"`);

    // ── Admin commands (no queue, instant) ──
    if (isAdmin(phone) && messageText.startsWith('!')) {
      const handled = await handleAdminCommand(message, client);
      if (handled) {
        console.log(`[ADMIN] ${senderNum} used command: ${messageText.split(' ')[0]}`);
        return;
      }
    }

    // ── User special commands ──
    if (messageText.toLowerCase() === '!reset') {
      clearHistory(phone);
      await message.reply('🔄 Conversation reset.\n\nSay *Namaste* to start fresh 🙏');
      return;
    }

    // ── Queue the message processing ──
    enqueue(phone, async () => {
      try {
        const chat = await message.getChat();

        // Simulate typing (anti-ban)
        await chat.sendStateTyping();

        // Get Claude reply (with key rotation)
        const reply = await getRutvikReply(phone, messageText);

        // Simulate typing duration based on reply length
        await simulateTyping(chat, reply);

        // Send reply
        await message.reply(reply);

        console.log(`[REPLY] → ${senderNum} (${reply.length} chars)`);

      } catch (err) {
        console.error(`[ERROR] Processing message from ${senderNum}:`, err.message);
        try {
          await message.reply(
            '🙏 Sorry, something went wrong. Please try again.\n\n' +
            'Or visit: https://rutvikbooking.netlify.app/'
          );
        } catch (_) {}
      }
    });

  } catch (err) {
    console.error('[CRITICAL] Message handler crashed:', err.message);
  }
});

// ── Start ─────────────────────────────────────────
console.log('\n🚀 Starting RUTVIK AI Ultimate WhatsApp Bot...\n');
client.initialize();

// ── Graceful Shutdown ─────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n⛔ Shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⛔ SIGTERM received — shutting down...');
  await client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message);
});
