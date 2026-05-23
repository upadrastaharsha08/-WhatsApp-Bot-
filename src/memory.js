// ════════════════════════════════════════════════
//   RUTVIK AI — Conversation Memory Manager
//   Per-user history with metadata tracking
// ════════════════════════════════════════════════

const MAX_HISTORY = parseInt(process.env.MAX_HISTORY_PER_USER || '20');

// Store: { phoneNumber: { messages: [], meta: {} } }
const store = new Map();

function ensureUser(phone) {
  if (!store.has(phone)) {
    store.set(phone, {
      messages: [],
      meta: {
        phone,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        messageCount: 0,
        language: 'unknown',
      },
    });
  }
  return store.get(phone);
}

function getHistory(phone) {
  return ensureUser(phone).messages;
}

function getMeta(phone) {
  return ensureUser(phone).meta;
}

function addMessage(phone, role, content) {
  const user = ensureUser(phone);
  user.messages.push({ role, content });
  user.meta.lastSeen = new Date().toISOString();
  user.meta.messageCount++;

  // Auto-detect language hint
  if (role === 'user') {
    const teluguPattern = /[\u0C00-\u0C7F]/;
    if (teluguPattern.test(content)) {
      user.meta.language = 'Telugu';
    } else if (user.meta.language === 'unknown') {
      user.meta.language = 'English';
    }
  }

  // Trim excess history (keep in pairs)
  if (user.messages.length > MAX_HISTORY) {
    user.messages.splice(0, user.messages.length - MAX_HISTORY);
  }
}

function clearHistory(phone) {
  const user = ensureUser(phone);
  user.messages = [];
  user.meta.messageCount = 0;
}

function getAllUsers() {
  const result = [];
  for (const [phone, data] of store.entries()) {
    result.push({
      phone,
      ...data.meta,
      historyLength: data.messages.length,
    });
  }
  return result.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
}

function getTotalStats() {
  let totalMessages = 0;
  for (const data of store.values()) {
    totalMessages += data.meta.messageCount;
  }
  return {
    totalUsers: store.size,
    totalMessages,
  };
}

module.exports = {
  getHistory,
  getMeta,
  addMessage,
  clearHistory,
  getAllUsers,
  getTotalStats,
};
