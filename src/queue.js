// ════════════════════════════════════════════════
//   RUTVIK AI — Smart Message Queue
//   - No dropped messages under high load
//   - Per-user serialization (no parallel replies)
//   - Configurable concurrency
//   - Queue depth monitoring
// ════════════════════════════════════════════════

const { default: PQueue } = require('p-queue');

const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '3');

// Global queue: limits total parallel Claude API calls
const globalQueue = new PQueue({ concurrency: CONCURRENCY });

// Per-user queues: ensures messages from same user are processed in order
const userQueues = new Map();

// Stats
let totalQueued = 0;
let totalProcessed = 0;
let totalFailed = 0;

function getUserQueue(phone) {
  if (!userQueues.has(phone)) {
    // Each user gets a serial queue (concurrency=1)
    userQueues.set(phone, new PQueue({ concurrency: 1 }));
  }
  return userQueues.get(phone);
}

/**
 * Enqueue a message processing task
 * @param {string} phone - User's phone number
 * @param {Function} task - Async function to execute
 */
async function enqueue(phone, task) {
  totalQueued++;
  const userQueue = getUserQueue(phone);

  // Add to user queue → inside, wait for global queue slot
  return userQueue.add(async () => {
    return globalQueue.add(async () => {
      try {
        const result = await task();
        totalProcessed++;
        return result;
      } catch (err) {
        totalFailed++;
        throw err;
      }
    });
  });
}

function getQueueStats() {
  return {
    globalPending: globalQueue.pending,
    globalSize: globalQueue.size,
    concurrency: CONCURRENCY,
    totalQueued,
    totalProcessed,
    totalFailed,
    activeUserQueues: userQueues.size,
  };
}

module.exports = { enqueue, getQueueStats };
