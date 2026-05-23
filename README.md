# 🕉️ RUTVIK AI — Ultimate WhatsApp Bot v2.0

Premium WhatsApp automation for RUTVIK spiritual services, powered by Claude AI.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔑 Multi-key rotation | 3 Claude API keys — auto fallback on failure |
| ⚠️ Rate limit detection | Detects 429 errors, puts key in cooldown, uses next |
| 📬 Message queue | No messages dropped under high load |
| 🛡️ Anti-ban typing | Realistic human typing delays before reply |
| 🛠️ Admin dashboard | Control bot via WhatsApp commands |
| 🧠 Per-user memory | 20-message history per user |
| 🚂 Railway ready | One-click deploy with `railway.json` |

---

## ⚡ Quick Setup (Local)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure `.env`
```env
ANTHROPIC_KEY_1=sk-ant-your-first-key
ANTHROPIC_KEY_2=sk-ant-your-second-key
ANTHROPIC_KEY_3=sk-ant-your-third-key

ADMIN_NUMBERS=919876543210
```

### 3. Start
```bash
npm start
```

### 4. Scan QR
WhatsApp → Linked Devices → Link a Device → Scan QR in terminal

---

## 🚂 Deploy on Railway (Free, 24/7)

1. **Push to GitHub** (never commit `.env`)
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Add environment variables in Railway dashboard:
   ```
   ANTHROPIC_KEY_1 = sk-ant-...
   ANTHROPIC_KEY_2 = sk-ant-...
   ANTHROPIC_KEY_3 = sk-ant-...
   ADMIN_NUMBERS   = 919876543210
   ```
4. Deploy → open **Logs** tab
5. QR code appears in logs → scan with WhatsApp
6. ✅ Bot is live 24/7!

> **Session persistence on Railway:**
> The `.wwebjs_auth/` session folder is stored inside the container.
> If Railway redeploys, you'll need to scan QR again once.
> For permanent session: use Railway Volume (attach to `/app/.wwebjs_auth`).

---

## 🛠️ Admin Dashboard Commands

Send these from your admin WhatsApp number:

| Command | Action |
|---------|--------|
| `!admin` | Show all commands |
| `!status` | Bot uptime, user count, message count |
| `!keys` | Each key's health, calls, failures, rate limits |
| `!queue` | Queue depth, processed, failed counts |
| `!users` | Last 15 active users with language & activity |
| `!clear 919876543210` | Clear specific user's conversation history |
| `!reset` | (any user) Reset your own conversation |

---

## 📁 Project Structure

```
rutvik-ultimate-bot/
├── src/
│   ├── index.js       ← Main bot entry + message router
│   ├── claude.js      ← Claude API call handler
│   ├── keyManager.js  ← Multi-key rotation + health tracking
│   ├── queue.js       ← Message queue (no dropped msgs)
│   ├── typing.js      ← Anti-ban typing simulator
│   ├── memory.js      ← Per-user conversation history
│   ├── admin.js       ← Admin dashboard commands
│   └── prompt.js      ← RUTVIK AI system prompt
├── .env               ← Your secrets (never share/commit)
├── railway.json       ← Railway deployment config
├── package.json
└── README.md
```

---

## ⚙️ All Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_KEY_1` | ✅ Yes | — | Primary Claude API key |
| `ANTHROPIC_KEY_2` | ✅ Yes | — | Secondary key (fallback) |
| `ANTHROPIC_KEY_3` | ✅ Yes | — | Tertiary key (fallback) |
| `ADMIN_NUMBERS` | ✅ Yes | — | Comma-separated admin phone numbers |
| `SESSION_NAME` | No | rutvik-session | WhatsApp session name |
| `MAX_HISTORY_PER_USER` | No | 20 | Conversation history length |
| `QUEUE_CONCURRENCY` | No | 3 | Parallel Claude API calls |
| `TYPING_DELAY_MIN` | No | 1500 | Min typing delay (ms) |
| `TYPING_DELAY_MAX` | No | 4000 | Max typing delay (ms) |
| `ENABLE_GROUP_CHAT` | No | false | Reply in group chats |
| `KEY_COOLDOWN_MS` | No | 60000 | Key cooldown after rate limit (ms) |

---

## 🔑 Key Rotation Logic

```
Message received
     ↓
Try Key 1
  ├─ Success → Reply ✅
  └─ Fail/RateLimit → Cooldown Key 1, Try Key 2
       ├─ Success → Reply ✅
       └─ Fail/RateLimit → Cooldown Key 2, Try Key 3
            ├─ Success → Reply ✅
            └─ All failed → Send "temporarily busy" message
```

Keys automatically recover after cooldown period (default: 60 seconds).

---

🙏 RUTVIK — Authentic Vedic Services
https://rutvikbooking.netlify.app/
