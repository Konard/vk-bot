const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { clean, year, second } = require('./utils');

const TTL_SECONDS = (year / second); // Store programmer status for 1 year
const targetPath = './data/friends/programmer-status.json';
let cache = null;

async function getCache() {
  if (cache) {
    return cache;
  }
  console.log('Initializing programmer status cache with jsonStore');
  const store = await jsonStore({ filePath: targetPath });

  cache = createCache({
    stores: [store],
  });

  return cache;
}

/**
 * Set programmer status for a friend
 * @param {number} friendId - Friend ID
 * @param {Object} status - Status object with properties:
 *   - isProgrammer: boolean
 *   - confidence: number (0-100)
 *   - method: string ('auto-detected', 'user-confirmed', 'user-denied')
 *   - checkedAt: Date
 *   - askedAt: Date (optional)
 *   - indicators: Array (optional)
 */
async function setProgrammerStatus(friendId, status) {
  console.log(`Setting programmer status for friendId ${friendId}:`, status);
  const cleanedStatus = clean({
    ...status,
    updatedAt: new Date().toISOString(),
  });
  const cacheInstance = await getCache();
  await cacheInstance.set(String(friendId), cleanedStatus, { ttl: TTL_SECONDS });
  console.log(`Programmer status set for friendId ${friendId}`);
  return cleanedStatus;
}

/**
 * Get programmer status for a friend
 * @param {number} friendId - Friend ID
 * @returns {Object|null} Status object or null if not found
 */
async function getProgrammerStatus(friendId) {
  const cacheInstance = await getCache();
  const status = await cacheInstance.get(String(friendId));
  return status || null;
}

/**
 * Get all programmer statuses
 * @returns {Object} Object with friendId as keys and status as values
 */
async function getAllProgrammerStatuses() {
  const cacheInstance = await getCache();
  const store = cacheInstance.store;

  // Access the underlying store data
  if (store && store.data) {
    return store.data;
  }

  return {};
}

/**
 * Mark that a friend has been asked about being a programmer
 * @param {number} friendId - Friend ID
 */
async function markAsAsked(friendId) {
  const existingStatus = await getProgrammerStatus(friendId);
  const status = {
    ...(existingStatus || { isProgrammer: null, confidence: 0 }),
    askedAt: new Date().toISOString(),
  };
  return await setProgrammerStatus(friendId, status);
}

/**
 * Check if a friend has been asked about being a programmer
 * @param {number} friendId - Friend ID
 * @returns {boolean}
 */
async function hasBeenAsked(friendId) {
  const status = await getProgrammerStatus(friendId);
  return status?.askedAt != null;
}

/**
 * Check if a friend needs to be checked
 * Returns true if:
 * - No status exists
 * - Status exists but isProgrammer is null and hasn't been asked
 * @param {number} friendId - Friend ID
 * @returns {boolean}
 */
async function needsCheck(friendId) {
  const status = await getProgrammerStatus(friendId);

  // No status exists
  if (!status) {
    return true;
  }

  // Status exists but isProgrammer is null and hasn't been asked
  if (status.isProgrammer === null && !status.askedAt) {
    return true;
  }

  return false;
}

module.exports = {
  setProgrammerStatus,
  getProgrammerStatus,
  getAllProgrammerStatuses,
  markAsAsked,
  hasBeenAsked,
  needsCheck,
};
