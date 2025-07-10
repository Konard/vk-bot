const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { sleep, second, week, minute } = require('./utils');

const TTL_SECONDS = (4 * week) / second; // TTL for friends count
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
  let total = 0;
  let offset = 0;
  let response;
  do {
    response = await context.vk.api.friends.get({ user_id: userId, count: 1, offset });
    await sleep(4 * minute);
    total += (typeof response.count === 'number' ? response.count : 0);
    offset += PAGE_LIMIT;
  } while (response.count === PAGE_LIMIT);
  return total;
}

async function getFriendsCountCached(context, userId) {
  const cacheInstance = await getCache();
  const key = String(userId);
  let count = await cacheInstance.get(key);
  if (typeof count === 'number' && count > 0 && count !== 5000) {
    return count;
  }
  count = await fetchFriendsCount(context, userId);
  await cacheInstance.set(key, count, { ttl: TTL_SECONDS });
  return count;
}

module.exports = { getFriendsCountCached }; 