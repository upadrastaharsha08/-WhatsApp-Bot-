// ════════════════════════════════════════════════
//   RUTVIK AI — Claude Handler
//   Uses multi-key manager for resilient API calls
// ════════════════════════════════════════════════

const { callClaudeWithFallback } = require('./keyManager');
const { RUTVIK_SYSTEM_PROMPT } = require('./prompt');
const { getHistory, addMessage } = require('./memory');

/**
 * Get RUTVIK AI reply for a user message
 * @param {string} phone - User's phone number (session key)
 * @param {string} userMessage - Incoming message text
 * @returns {Promise<string>} - AI reply
 */
async function getRutvikReply(phone, userMessage) {
  // Save user message to history
  addMessage(phone, 'user', userMessage);

  // Get full conversation history for this user
  const messages = getHistory(phone);

  // Call Claude with multi-key fallback
  const response = await callClaudeWithFallback(messages, RUTVIK_SYSTEM_PROMPT);

  if (!response) {
    // All keys failed — remove the last user message to keep history clean
    const hist = getHistory(phone);
    if (hist.length > 0 && hist[hist.length - 1].role === 'user') {
      hist.pop();
    }
    return (
      '🙏 Our systems are temporarily busy. Please try again in a moment.\n\n' +
      'Or book directly:\nhttps://rutvikbooking.netlify.app/'
    );
  }

  // Extract text from response
  const replyText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  // Save assistant reply to history
  addMessage(phone, 'assistant', replyText);

  return replyText;
}

module.exports = { getRutvikReply };
