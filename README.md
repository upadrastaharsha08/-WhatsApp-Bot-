# 🕉️ RUTVIK AI — Ultimate WhatsApp Bot

### Intelligent WhatsApp Automation for RUTVIK Spiritual Services

**RUTVIK AI** is a production-oriented WhatsApp AI assistant designed for automated customer conversations, spiritual-service guidance, booking assistance, and 24/7 conversational support.

Built with **WhatsApp Web automation + Claude AI**, the platform combines intelligent responses, per-user conversation memory, API-key failover, message queuing, human-like typing behavior, and an administrator control layer into a single lightweight system.

> **One WhatsApp number. Multiple AI capabilities. Reliable conversations.**

🌐 **RUTVIK Services:** https://rutvikbooking.netlify.app/

---

## 🚀 Why RUTVIK AI?

Traditional WhatsApp bots usually fail when traffic increases, an AI provider returns rate limits, or multiple users message simultaneously.

RUTVIK AI is designed around those operational problems.

### Core capabilities

| Capability            | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| 🧠 Claude AI          | Intelligent natural-language conversations                      |
| 🔑 Multi-Key Failover | Automatically switches between configured API keys              |
| ⚡ Rate-Limit Recovery | Detects API throttling and temporarily cools down affected keys |
| 📬 Message Queue      | Prevents messages from being lost during traffic spikes         |
| 👤 User Memory        | Maintains recent conversation context per WhatsApp user         |
| ⌨️ Typing Simulation  | Adds configurable response delays for natural interaction       |
| 🛡️ Admin Controls    | Monitor and control the bot directly through WhatsApp           |
| 📊 Runtime Metrics    | Track users, messages, queues, keys, failures and uptime        |
| 🚂 Railway Ready      | Designed for straightforward cloud deployment                   |
| 👥 Group Control      | Optional group-chat support                                     |
| 🔄 Automatic Recovery | Failed keys automatically become available again                |

---

# 🏗️ High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      WhatsApp       │
                         │       Users         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   WhatsApp Client   │
                         │    Message Router   │
                         └──────────┬──────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     ▼                             ▼
             ┌──────────────┐             ┌──────────────┐
             │ User Memory  │             │ Admin Router │
             │ Last N Msgs  │             │  Commands    │
             └──────┬───────┘             └──────────────┘
                    │
                    ▼
             ┌──────────────┐
             │ Message Queue│
             │ + Concurrency│
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │ Claude Layer │
             └──────┬───────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       ┌─────┐   ┌─────┐   ┌─────┐
       │Key 1│   │Key 2│   │Key 3│
       └──┬──┘   └──┬──┘   └──┬──┘
          │         │         │
          └─────────┼─────────┘
                    ▼
             ┌──────────────┐
             │ AI Response  │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │ Typing Delay │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │   WhatsApp   │
             │     Reply    │
             └──────────────┘
```

---

# ✨ Feature Deep Dive

## 🧠 AI Conversation Engine

Every incoming message is processed through the RUTVIK AI system prompt before being sent to Claude.

The AI layer can be configured to:

* Understand customer questions
* Maintain conversational context
* Provide service information
* Guide users through available services
* Answer frequently asked questions
* Handle multilingual conversations
* Maintain the RUTVIK brand tone
* Recover gracefully from incomplete questions
* Escalate conversations when human assistance is required

The AI behavior is centralized in:

```text
src/prompt.js
```

This makes the bot's personality and business rules easy to customize.

---

# 🔑 Intelligent API Key Rotation

RUTVIK AI supports multiple Claude API keys.

Instead of relying on a single API key, the system maintains health information for each configured key.

### Request flow

```text
Incoming Message
       │
       ▼
   Select Key
       │
       ▼
 ┌─────────────┐
 │    Key 1    │
 └──────┬──────┘
        │
   ┌────┴─────┐
   │          │
Success     Failure
   │          │
   ▼          ▼
 Reply     Cooldown
              │
              ▼
          ┌─────────┐
          │  Key 2  │
          └────┬────┘
               │
          ┌────┴────┐
          │         │
       Success    Failure
          │         │
          ▼         ▼
        Reply    Cooldown
                    │
                    ▼
                ┌─────────┐
                │  Key 3  │
                └────┬────┘
                     │
                     ▼
              Final Fallback
```

### Key health tracking

Each key can maintain metrics such as:

* Total requests
* Successful requests
* Failed requests
* Rate-limit events
* Current cooldown state
* Last successful request
* Last failure
* Availability status

---

# ⚠️ Rate-Limit Protection

When an API request returns a rate-limit response, the affected key is temporarily placed into cooldown.

Example:

```text
Key 1
 ↓
429 Rate Limit
 ↓
Cooldown: 60 seconds
 ↓
Key 2 selected
 ↓
Request continues
```

After the cooldown expires:

```text
Key 1 → Available Again
```

This prevents repeatedly sending requests through a temporarily unavailable key.

Configure the cooldown period with:

```env
KEY_COOLDOWN_MS=60000
```

---

# 📬 Message Queue

The queue protects the application when multiple users send messages simultaneously.

Without a queue:

```text
User A ─────┐
User B ─────┼──► Claude
User C ─────┤
User D ─────┘
```

With RUTVIK AI:

```text
User A ──┐
User B ──┤
User C ──┼──► Message Queue ──► Workers ──► Claude
User D ──┤
User E ──┘
```

Configure worker concurrency:

```env
QUEUE_CONCURRENCY=3
```

Higher concurrency increases throughput, but should be configured according to your infrastructure and AI-provider limits.

---

# 👤 Per-User Conversation Memory

RUTVIK AI maintains recent conversation history independently for each WhatsApp user.

Example:

```text
User: What services do you provide?

AI: We provide ...

User: What is the price?

AI: Based on the service you asked about...

User: Can I book it tomorrow?

AI: Yes, ...
```

The bot understands that:

> "it"

refers to the previously discussed service.

### Default memory

```env
MAX_HISTORY_PER_USER=20
```

This means the application retains the configured number of recent messages for each user.

---

# ⌨️ Human-Like Typing Simulation

Instead of immediately responding after receiving a message, the bot can simulate a short typing period.

```text
Message Received
       ↓
AI Processing
       ↓
Typing Indicator
       ↓
Random Delay
       ↓
Response
```

Configuration:

```env
TYPING_DELAY_MIN=1500
TYPING_DELAY_MAX=4000
```

> This feature is intended to make conversations feel less abrupt. It should not be treated as a guarantee against WhatsApp restrictions or bans.

---

# 🛡️ Admin Control Center

Administrators can control the bot directly from WhatsApp.

Configure:

```env
ADMIN_NUMBERS=919876543210
```

Multiple administrators:

```env
ADMIN_NUMBERS=919876543210,919812345678,919876512345
```

---

## 🔧 Available Commands

| Command           | Purpose                            |
| ----------------- | ---------------------------------- |
| `!admin`          | Display administrator commands     |
| `!status`         | Display runtime status             |
| `!keys`           | Inspect AI-key health              |
| `!queue`          | Inspect queue statistics           |
| `!users`          | Display recent active users        |
| `!clear <number>` | Clear a user's stored conversation |
| `!reset`          | Reset your own conversation        |

### Example

```text
Admin:
!status
```

Possible response:

```text
RUTVIK AI STATUS

Uptime: 6h 32m
Active Users: 127
Messages: 1,842
Queue: 2
Failed: 4
AI Keys Available: 2/3
```

---

# 📊 Operational Visibility

The administration layer provides visibility into the most important runtime components.

### AI Key Metrics

```text
Key 1
Status: HEALTHY
Calls: 1,204
Failures: 7
Rate Limits: 2

Key 2
Status: COOLDOWN
Calls: 982
Failures: 11
Rate Limits: 5

Key 3
Status: HEALTHY
Calls: 731
Failures: 3
Rate Limits: 0
```

### Queue Metrics

```text
Queue Depth: 4
Processed: 2,842
Failed: 7
Active Workers: 3
```

---

# 🌍 Multilingual Conversations

The AI layer can be configured for multilingual customer support.

Depending on the system prompt and model behavior, users can communicate using languages such as:

* English
* Telugu
* Hindi
* Tamil
* Kannada
* Malayalam
* Other supported languages

Example:

```text
User:
మీ సేవల గురించి చెప్పగలరా?

RUTVIK AI:
తప్పకుండా 🙏
మా సేవల గురించి వివరాలు...
```

---

# 📁 Project Structure

```text
rutvik-ultimate-bot/
│
├── src/
│   ├── index.js
│   │   └── WhatsApp client + application entry point
│   │
│   ├── claude.js
│   │   └── Claude API integration
│   │
│   ├── keyManager.js
│   │   └── API-key rotation + health tracking
│   │
│   ├── queue.js
│   │   └── Message queue + worker concurrency
│   │
│   ├── typing.js
│   │   └── Typing simulation
│   │
│   ├── memory.js
│   │   └── Per-user conversation memory
│   │
│   ├── admin.js
│   │   └── Administrator commands
│   │
│   └── prompt.js
│       └── RUTVIK AI system instructions
│
├── .env
├── .gitignore
├── package.json
├── railway.json
└── README.md
```

---

# ⚡ Quick Start

## 1. Clone the project

```bash
git clone <your-repository-url>
cd rutvik-ultimate-bot
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create:

```text
.env
```

Example:

```env
ANTHROPIC_KEY_1=your-first-api-key
ANTHROPIC_KEY_2=your-second-api-key
ANTHROPIC_KEY_3=your-third-api-key

ADMIN_NUMBERS=919876543210
```

## 4. Start the bot

```bash
npm start
```

## 5. Authenticate WhatsApp

Open WhatsApp:

```text
WhatsApp
   ↓
Linked Devices
   ↓
Link a Device
   ↓
Scan QR Code
```

Once authenticated, the bot can begin receiving messages.

---

# ⚙️ Environment Configuration

| Variable               | Required |          Default | Description                   |
| ---------------------- | -------: | ---------------: | ----------------------------- |
| `ANTHROPIC_KEY_1`      |        ✅ |                — | Primary AI API key            |
| `ANTHROPIC_KEY_2`      |       ⚠️ |                — | Secondary fallback key        |
| `ANTHROPIC_KEY_3`      |       ⚠️ |                — | Tertiary fallback key         |
| `ADMIN_NUMBERS`        |        ✅ |                — | Comma-separated admin numbers |
| `SESSION_NAME`         |        ❌ | `rutvik-session` | WhatsApp session identifier   |
| `MAX_HISTORY_PER_USER` |        ❌ |             `20` | Maximum conversation history  |
| `QUEUE_CONCURRENCY`    |        ❌ |              `3` | Number of concurrent workers  |
| `TYPING_DELAY_MIN`     |        ❌ |           `1500` | Minimum typing delay          |
| `TYPING_DELAY_MAX`     |        ❌ |           `4000` | Maximum typing delay          |
| `ENABLE_GROUP_CHAT`    |        ❌ |          `false` | Enable group responses        |
| `KEY_COOLDOWN_MS`      |        ❌ |          `60000` | API-key cooldown duration     |

> **Production recommendation:** Keep secrets in your hosting provider's secret/environment-variable manager rather than committing them to source control.

---

# 🔐 Security

Never commit API keys or session credentials.

Your `.gitignore` should include:

```gitignore
.env
.wwebjs_auth/
.wwebjs_cache/
node_modules/
*.log
```

### ❌ Never do this

```text
git add .env
git commit -m "add api keys"
git push
```

### ✅ Do this instead

```text
.env
   ↓
Environment Variables
   ↓
Railway / Cloud Secret Manager
   ↓
Application
```

If an API key is accidentally exposed, revoke and replace it immediately.

---

# 🚂 Railway Deployment

RUTVIK AI can be deployed to Railway or a similar Node.js hosting environment.

## Deployment flow

```text
GitHub
   │
   ▼
Railway
   │
   ▼
Node.js Application
   │
   ├── Claude API
   │
   └── WhatsApp Client
```

### Steps

1. Push the project to GitHub.
2. Do **not** push `.env`.
3. Create a Railway project.
4. Connect your GitHub repository.
5. Add environment variables.
6. Deploy.
7. Open deployment logs.
8. Complete WhatsApp authentication.

---

# 💾 WhatsApp Session Persistence

The WhatsApp authentication state may be stored under:

```text
.wwebjs_auth/
```

If the hosting environment recreates the container without persistent storage, the authentication session may be lost.

For persistent deployments, use a supported persistent volume/storage strategy and mount it to the application's authentication directory.

```text
Persistent Storage
       │
       ▼
.wwebjs_auth/
       │
       ▼
WhatsApp Session
```

---

# 🧩 Configuration Profiles

You can maintain different configurations for different environments.

### Development

```env
QUEUE_CONCURRENCY=1
MAX_HISTORY_PER_USER=10
ENABLE_GROUP_CHAT=false
```

### Production

```env
QUEUE_CONCURRENCY=3
MAX_HISTORY_PER_USER=20
ENABLE_GROUP_CHAT=false
KEY_COOLDOWN_MS=60000
```

---

# 🔄 End-to-End Message Lifecycle

When a customer sends a WhatsApp message:

```text
01  Customer sends message
          ↓
02  WhatsApp client receives event
          ↓
03  Message validation
          ↓
04  Group/admin filtering
          ↓
05  User conversation loaded
          ↓
06  Message added to queue
          ↓
07  Worker picks up message
          ↓
08  AI key selected
          ↓
09  Claude request executed
          ↓
10  Rate-limit/error handling
          ↓
11  Conversation memory updated
          ↓
12  Typing simulation
          ↓
13  WhatsApp response sent
          ↓
14  Runtime metrics updated
```

---

# 🧠 AI Prompt Architecture

The core AI behavior is separated from the infrastructure.

```text
WhatsApp Layer
      │
      ▼
Conversation Context
      │
      ▼
RUTVIK System Prompt
      │
      ├── Brand Identity
      ├── Service Knowledge
      ├── Conversation Rules
      ├── Language Behavior
      ├── Safety Rules
      └── Escalation Rules
      │
      ▼
Claude
      │
      ▼
Customer Response
```

This separation makes it possible to modify the bot's behavior without rewriting the WhatsApp integration.

---

# 🛠️ Customization

## Change AI Personality

Edit:

```text
src/prompt.js
```

You can customize:

* Tone
* Greeting
* Language
* Spiritual terminology
* Service descriptions
* Booking guidance
* FAQ responses
* Escalation behavior
* Response length
* Brand personality

---

# 🧪 Testing Strategy

Before production deployment, test the following scenarios:

```text
✓ Normal customer message
✓ Multiple simultaneous users
✓ Long message
✓ Empty message
✓ Unsupported message type
✓ API timeout
✓ API 429 rate limit
✓ API authentication failure
✓ All keys unavailable
✓ Queue overload
✓ Admin command
✓ Unauthorized admin command
✓ User reset
✓ User history clearing
✓ WhatsApp reconnect
✓ Session restoration
✓ Group-message filtering
```

---

# 🚨 Failure Handling

RUTVIK AI is designed to fail gracefully.

### AI failure

```text
Claude Error
    ↓
Try next healthy key
    ↓
Success → Reply
```

### All keys unavailable

```text
Key 1 ❌
Key 2 ❌
Key 3 ❌
   ↓
Temporary fallback response
   ↓
System recovers automatically
```

### Queue overload

```text
Incoming Messages
       ↓
     Queue
       ↓
Workers process gradually
```

---

# 🩺 Troubleshooting

## QR code is not appearing

Check:

```bash
npm start
```

Then inspect application logs.

---

## Bot is not responding

Check:

```text
1. WhatsApp authentication
2. Claude API keys
3. Network connectivity
4. Application logs
5. Queue status
```

---

## API key keeps failing

Use:

```text
!keys
```

Then verify:

```text
Status
Failures
Rate Limits
Cooldown
```

---

## Messages are delayed

Check:

```text
!queue
```

Then review:

```env
QUEUE_CONCURRENCY
```

Also verify that the AI provider is not rate limiting requests.

---

# 📈 Recommended Production Improvements

For larger deployments, consider adding:

### Database-backed memory

Replace in-memory history with:

```text
MongoDB
PostgreSQL
Redis
```

### Persistent queue

Consider:

```text
Redis + BullMQ
```

### Observability

Add:

```text
Structured logging
Error tracking
Metrics
Health endpoints
Alerting
```

### AI quality monitoring

Track:

```text
Response latency
API failures
Fallback frequency
Conversation completion
User satisfaction
Escalation rate
```

---

# 🗺️ Roadmap

## Version 2.1

* [ ] Persistent database memory
* [ ] Advanced analytics
* [ ] Conversation export
* [ ] Improved admin dashboard
* [ ] Service-specific knowledge base
* [ ] Human handoff workflow

## Version 2.2

* [ ] RAG-based service knowledge
* [ ] Appointment/booking integration
* [ ] Customer profile management
* [ ] Scheduled notifications
* [ ] Broadcast management
* [ ] Conversation tagging

## Version 3.0

* [ ] Web-based admin console
* [ ] Multi-business support
* [ ] AI-powered analytics
* [ ] Advanced agent orchestration
* [ ] Voice-message understanding
* [ ] Image/document understanding
* [ ] CRM integration
* [ ] Enterprise observability

---

# 🏆 Design Principles

RUTVIK AI follows a few simple principles:

### Reliability First

AI failures should not bring down the entire bot.

### Graceful Degradation

If one API key fails, another can take over.

### Conversation Continuity

Users should not have to repeat the entire conversation.

### Operational Visibility

Administrators should know what the system is doing.

### Security by Default

Secrets and authentication data should never be committed to Git.

### Modular Architecture

Each major responsibility should remain independently maintainable.

---

# 📜 Important Operational Note

This project automates WhatsApp interactions through a WhatsApp Web-based client.

Deployment behavior, account restrictions, automation limitations, and session requirements can change over time. Always review the applicable WhatsApp policies and the terms of the libraries/services used before operating the bot at scale.

API keys should also be managed according to the AI provider's current terms and limits.

---

# 🤝 Contributing

Contributions are welcome.

Typical contribution flow:

```bash
git checkout -b feature/my-feature
```

Make your changes, test them, then:

```bash
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

Open a pull request with:

* What changed
* Why it changed
* Testing performed
* Configuration changes
* Screenshots/logs where applicable

---

# 📄 License

Add the project's chosen license here.

For example:

```text
MIT License
```

or replace it with your organization's preferred license.

---

# 🙏 RUTVIK

**Authentic Vedic Services**

🌐 https://rutvikbooking.netlify.app/

Built to make spiritual-service conversations simpler, faster, and more accessible through AI.

---

## 👨‍💻 Developed By

### **Upadrasta Harsha Vardhan**

AI Automation Engineer • QA Automation • Generative AI • Intelligent Agents

Building practical AI systems that combine automation, intelligent agents, and real-world engineering.

---

<p align="center">

### 🕉️ RUTVIK AI

**AI-powered conversations for modern spiritual services**

`WhatsApp` • `Claude AI` • `Node.js` • `Automation` • `Multi-Agent Ready`

</p>
