// ════════════════════════════════════════════════
//   RUTVIK AI — Multi-Key Manager
//   Handles 3 Claude API keys with:
//   - Auto rotation on failure
//   - Rate limit detection & cooldown
//   - Per-key health tracking
//   - Stats for admin dashboard
// ════════════════════════════════════════════════

const Anthropic = require('@anthropic-ai/sdk');

const COOLDOWN_MS = parseInt(process.env.KEY_COOLDOWN_MS || '60000');

// ── Load keys from env ────────────────────────────
function loadKeys() {
  const keys = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`ANTHROPIC_KEY_${i}`];
    if (key && key.startsWith('sk-ant-') && key.length > 20) {
      keys.push(key);
    }
  }
  if (keys.length === 0) {
    console.error('\n❌ ERROR: No valid ANTHROPIC_KEY_1/2/3 found in .env!');
    console.error('👉 Get keys from: https://console.anthropic.com/\n');
    process.exit(1);
  }
  return keys;
}

const API_KEYS = loadKeys();

// ── Key state tracking ────────────────────────────
const keyStates = API_KEYS.map((key, index) => ({
  index,
  key,
  client: new Anthropic({ apiKey: key }),
  isHealthy: true,
  cooldownUntil: 0,
  totalRequests: 0,
  successCount: 0,
  failureCount: 0,
  rateLimitHits: 0,
  lastUsed: null,
  lastError: null,
}));

let currentKeyIndex = 0;

// ── Get next healthy key ──────────────────────────
function getNextHealthyKey() {
  const now = Date.now();
  const total = keyStates.length;

  // First try: restore cooled-down keys
  for (const state of keyStates) {
    if (!state.isHealthy && now >= state.cooldownUntil) {
      state.isHealthy = true;
      console.log(`[KEY-MANAGER] 🔄 Key ${state.index + 1} restored after cooldown`);
    }
  }

  // Try keys starting from current, rotate
  for (let i = 0; i < total; i++) {
    const idx = (currentKeyIndex + i) % total;
    if (keyStates[idx].isHealthy) {
      currentKeyIndex = (idx + 1) % total; // advance for next call
      return keyStates[idx];
    }
  }

  return null; // All keys exhausted
}

// ── Mark key as failed ────────────────────────────
function markKeyFailed(keyState, isRateLimit = false) {
  keyState.isHealthy = false;
  keyState.failureCount++;
  keyState.cooldownUntil = Date.now() + COOLDOWN_MS;

  if (isRateLimit) {
    keyState.rateLimitHits++;
    console.warn(`[KEY-MANAGER] ⚠️  Key ${keyState.index + 1} rate limited — cooldown ${COOLDOWN_MS / 1000}s`);
  } else {
    console.warn(`[KEY-MANAGER] ❌ Key ${keyState.index + 1} failed — cooldown ${COOLDOWN_MS / 1000}s`);
  }
}

// ── Detect rate limit errors ──────────────────────
function isRateLimitError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const status = error.status || error.statusCode || 0;
  return (
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('overloaded') ||
    msg.includes('quota')
  );
}

// ── Main: Call Claude with fallback rotation ──────
async function callClaudeWithFallback(messages, systemPrompt) {
  const totalKeys = keyStates.length;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyState = getNextHealthyKey();

    if (!keyState) {
      console.error('[KEY-MANAGER] 🚨 All keys exhausted or in cooldown!');
      return null;
    }

    keyState.totalRequests++;
    keyState.lastUsed = new Date().toISOString();

    console.log(`[KEY-MANAGER] 🔑 Using Key ${keyState.index + 1} (attempt ${attempt + 1}/${totalKeys})`);

    try {
      const response = await keyState.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      keyState.successCount++;
      return response;

    } catch (error) {
      keyState.lastError = error.message;
      const rateLimit = isRateLimitError(error);
      markKeyFailed(keyState, rateLimit);

      console.warn(`[KEY-MANAGER] Trying next key... (${error.message?.slice(0, 60)})`);
      // Continue loop to try next key
    }
  }

  return null; // All attempts failed
}

// ── Get stats for admin dashboard ─────────────────
function getKeyStats() {
  const now = Date.now();
  return keyStates.map((s) => ({
    key: `Key ${s.index + 1}`,
    status: s.isHealthy ? '✅ Healthy' : `❌ Cooldown (${Math.max(0, Math.ceil((s.cooldownUntil - now) / 1000))}s left)`,
    totalRequests: s.totalRequests,
    successCount: s.successCount,
    failureCount: s.failureCount,
    rateLimitHits: s.rateLimitHits,
    lastUsed: s.lastUsed || 'Never',
    lastError: s.lastError || 'None',
  }));
}

module.exports = { callClaudeWithFallback, getKeyStats, keyStates };
