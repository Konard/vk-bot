const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { sleep, second, week } = require('./utils');

const TTL_SECONDS = week / second; // One week TTL for friends count
const targetPath = './data/friends-count/friends-count.json';
let cache;

async function getCache() {
  if (!cache) {
    const store = await jsonStore({ filePath: targetPath });
    cache = createCache({ stores: [store] });
  }
  return cache;
}

async function fetchFriendsCount(context, userId) {
  const response = await context.vk.api.friends.get({ user_id: userId, count: 1 });
  // Rate limiting to avoid hitting VK API limits
  await sleep(10 * second);

  console.log('fetchFriendsCount', 'response', response);

  return response.count || response.total || 0;
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