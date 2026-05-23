// ════════════════════════════════════════════════
//   RUTVIK AI — Smart Message Queue (No ESM deps)
//   - No dropped messages under high load
//   - Per-user serialization (no parallel replies)
//   - Configurable concurrency
//   - Queue depth monitoring
// ════════════════════════════════════════════════

const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '3');

// Stats
let totalQueued = 0;
let totalProcessed = 0;
let totalFailed = 0;
let globalPending = 0;

// Per-user queues
const userQueues = new Map();
const userRunning = new Map();

// Global concurrency limiter
let globalRunning = 0;
const globalWaiting = [];

function acquireGlobalSlot() {
  return new Promise((resolve) => {
    if (globalRunning < CONCURRENCY) {
      globalRunning++;
      resolve();
    } else {
      globalWaiting.push(resolve);
    }
  });
}

function releaseGlobalSlot() {
  if (globalWaiting.length > 0) {
    const next = globalWaiting.shift();
    next();
  } else {
    globalRunning--;
  }
}

function getUserQueue(phone) {
  if (!userQueues.has(phone)) {
    userQueues.set(phone, []);
    userRunning.set(phone, false);
  }
  return userQueues.get(phone);
}

async function processUserQueue(phone) {
  if (userRunning.get(phone)) return;
  const queue = getUserQueue(phone);
  if (queue.length === 0) return;

  userRunning.set(phone, true);
  const { task, resolve, reject } = queue.shift();

  try {
    await acquireGlobalSlot();
    globalPending++;
    try {
      const result = await task();
      totalProcessed++;
      resolve(result);
    } catch (err) {
      totalFailed++;
      reject(err);
    } finally {
      globalPending--;
      releaseGlobalSlot();
    }
  } finally {
    userRunning.set(phone, false);
    processUserQueue(phone);
  }
}

async function enqueue(phone, task) {
  totalQueued++;
  return new Promise((resolve, reject) => {
    getUserQueue(phone).push({ task, resolve, reject });
    processUserQueue(phone);
  });
}

function getQueueStats() {
  return {
    globalPending,
    globalSize: globalWaiting.length,
    concurrency: CONCURRENCY,
    totalQueued,
    totalProcessed,
    totalFailed,
    activeUserQueues: userQueues.size,
  };
}

module.exports = { enqueue, getQueueStats };
