// ════════════════════════════════════════════════
//   RUTVIK AI — Anti-Ban Typing Simulator
//   Mimics human typing behavior to avoid WhatsApp bans
// ════════════════════════════════════════════════

const MIN_DELAY = parseInt(process.env.TYPING_DELAY_MIN || '1500');
const MAX_DELAY = parseInt(process.env.TYPING_DELAY_MAX || '4000');

/**
 * Random delay between min and max ms
 */
function randomDelay(min = MIN_DELAY, max = MAX_DELAY) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for given ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate typing duration based on reply length
 * Longer messages = slightly longer typing time (realistic)
 */
function calculateTypingDuration(replyText) {
  const baseDelay = randomDelay();
  const charFactor = Math.min(replyText.length * 2, 2000); // max 2s extra
  return baseDelay + charFactor;
}

/**
 * Simulate human typing with realistic delay
 * @param {object} chat - WhatsApp chat object
 * @param {string} replyText - The reply to be sent
 */
async function simulateTyping(chat, replyText) {
  try {
    await chat.sendStateTyping();
    const duration = calculateTypingDuration(replyText);
    await sleep(duration);
    await chat.clearState();
  } catch (_) {
    // Non-critical — continue even if typing state fails
    await sleep(randomDelay());
  }
}

module.exports = { simulateTyping, sleep, randomDelay };
