// ════════════════════════════════════════════════
//   RUTVIK AI — Admin Dashboard (WhatsApp Commands)
//   Accessible only to numbers in ADMIN_NUMBERS env
// ════════════════════════════════════════════════

const { getKeyStats } = require('./keyManager');
const { getAllUsers, getTotalStats, clearHistory } = require('./memory');
const { getQueueStats } = require('./queue');

// ── Load admin numbers ────────────────────────────
const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || '')
  .split(',')
  .map((n) => n.trim())
  .filter(Boolean);

function isAdmin(phone) {
  const num = phone.replace('@c.us', '').replace('+', '');
  return ADMIN_NUMBERS.includes(num);
}

// ── Format uptime ─────────────────────────────────
const BOT_START_TIME = Date.now();
function formatUptime() {
  const ms = Date.now() - BOT_START_TIME;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

// ── Admin command list ────────────────────────────
const ADMIN_HELP = `🛡️ *RUTVIK AI — Admin Dashboard*

📋 *Commands:*

!admin — Show this help menu
!status — Bot status & uptime
!keys — API key health & stats
!queue — Message queue stats
!users — Active user sessions
!clear [number] — Clear user history
!broadcast [msg] — (coming soon)

🙏 Admin access only`;

// ── Handle admin commands ─────────────────────────
async function handleAdminCommand(message, client) {
  const phone = message.from;
  const text = message.body.trim();
  const cmd = text.split(' ')[0].toLowerCase();

  switch (cmd) {

    case '!admin':
      await message.reply(ADMIN_HELP);
      return true;

    case '!status': {
      const stats = getTotalStats();
      const qStats = getQueueStats();
      const reply =
        `🕉️ *RUTVIK AI Bot Status*\n\n` +
        `✅ Status: Online\n` +
        `⏱️ Uptime: ${formatUptime()}\n` +
        `👥 Total Users: ${stats.totalUsers}\n` +
        `💬 Total Messages: ${stats.totalMessages}\n\n` +
        `📬 *Queue Status:*\n` +
        `• Pending: ${qStats.globalPending}\n` +
        `• In Queue: ${qStats.globalSize}\n` +
        `• Processed: ${qStats.totalProcessed}\n` +
        `• Failed: ${qStats.totalFailed}\n` +
        `• Concurrency: ${qStats.concurrency}\n`;
      await message.reply(reply);
      return true;
    }

    case '!keys': {
      const keyStats = getKeyStats();
      let reply = `🔑 *API Key Health Report*\n\n`;
      for (const k of keyStats) {
        reply +=
          `*${k.key}*\n` +
          `• Status: ${k.status}\n` +
          `• Total Calls: ${k.totalRequests}\n` +
          `• ✅ Success: ${k.successCount}\n` +
          `• ❌ Failures: ${k.failureCount}\n` +
          `• ⚠️ Rate Limits: ${k.rateLimitHits}\n` +
          `• Last Used: ${k.lastUsed}\n` +
          `• Last Error: ${k.lastError}\n\n`;
      }
      await message.reply(reply);
      return true;
    }

    case '!queue': {
      const q = getQueueStats();
      const reply =
        `📬 *Queue Statistics*\n\n` +
        `• Global Pending: ${q.globalPending}\n` +
        `• Queue Size: ${q.globalSize}\n` +
        `• Concurrency Limit: ${q.concurrency}\n` +
        `• Total Queued: ${q.totalQueued}\n` +
        `• Total Processed: ${q.totalProcessed}\n` +
        `• Total Failed: ${q.totalFailed}\n` +
        `• Active User Queues: ${q.activeUserQueues}`;
      await message.reply(reply);
      return true;
    }

    case '!users': {
      const users = getAllUsers().slice(0, 15); // top 15 recent
      if (users.length === 0) {
        await message.reply('👥 No active user sessions yet.');
        return true;
      }
      let reply = `👥 *Recent Users (${users.length})*\n\n`;
      for (const u of users) {
        reply +=
          `📱 +${u.phone.replace('@c.us', '')}\n` +
          `• Language: ${u.language}\n` +
          `• Messages: ${u.messageCount}\n` +
          `• Last Seen: ${new Date(u.lastSeen).toLocaleString('en-IN')}\n\n`;
      }
      await message.reply(reply);
      return true;
    }

    case '!clear': {
      const target = text.split(' ')[1];
      if (!target) {
        await message.reply('Usage: !clear [phone_number]\nExample: !clear 919876543210');
        return true;
      }
      const targetPhone = target.includes('@c.us') ? target : `${target}@c.us`;
      clearHistory(targetPhone);
      await message.reply(`✅ Conversation history cleared for ${target}`);
      return true;
    }

    default:
      return false; // Not an admin command
  }
}

module.exports = { isAdmin, handleAdminCommand };
