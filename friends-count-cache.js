const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { sleep, second, week } = require('./utils');

const TTL_SECONDS = week / second; // One week TTL for friends count
const targetPath = './data/friends-count/friends-count.json';
let cache;

const PAGE_LIMIT = 5000;

async function getCache() {
  if (!cache) {
    const store = await jsonStore({ filePath: targetPath });
    cache = createCache({ stores: [store] });
  }
  return cache;
}

async function fetchFriendsCount(context, userId) {
  try {
    let total = 0;
    let offset = 0;
    let response;
    do {
      response = await context.vk.api.friends.get({ user_id: userId, count: 1, offset });
      await sleep(10 * second);
      total += (typeof response.count === 'number' ? response.count : 0);
      offset += PAGE_LIMIT;
    } while (response.count === PAGE_LIMIT);
    return total;
  } catch (error) {
    console.log(`Could not fetch friends count for user ${userId}:`, error.message);
    return 0;
  }
}

async function getFriendsCountCached(context, userId) {
  const cacheInstance = await getCache();
  const key = String(userId);
  let count = await cacheInstance.get(key);
  if (typeof count === 'number') {
    return count;
  }
  count = await fetchFriendsCount(context, userId);
  await cacheInstance.set(key, count, { ttl: TTL_SECONDS });
  return count;
}

module.exports = { getFriendsCountCached }; 