const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { eraseMetadata, sleep, clean, hour, second } = require('./utils');
const { makeCachedFunction } = require('./functions-cache');

const allFriendsTtl = 12 * hour;
const allFriendsTtlSeconds = allFriendsTtl / second;
const TTL_SECONDS = 3600; // Time-to-live in seconds
const targetPath = './data/friends/friends.json';
let cache = null;

async function getCache() {
  if (cache) {
    return cache;
  }
  console.log('Initializing cache with jsonStore');
  const store = await jsonStore({ filePath: targetPath });

  // Pass jsonStore directly as the store
  cache = createCache({
    stores: [store], // Wrap jsonStore in an array under the stores property
  });

  return cache;
}

async function setFriend(friendId, friendData) {
  console.log(`setFriend called with friendId: ${friendId}`);
  const cleanedFriendData = clean(eraseMetadata(friendData));
  console.log(`Setting friend data for friendId ${friendId}:`, cleanedFriendData);
  const cacheInstance = await getCache();
  console.log(`Cache instance obtained:`, cacheInstance);
  await cacheInstance.set(friendId, cleanedFriendData, { ttl: TTL_SECONDS }); // Use the constant for TTL
  console.log(`Friend data set for friendId ${friendId}`);
  return cleanedFriendData;
}

async function getOrSetFriend(friendId, friendData) {
  console.log(`Getting or setting friend data for friendId ${friendId}`);
  let cachedFriendData = await (await getCache()).get(friendId);
  console.log(`Cached friend data for friendId ${friendId}:`, cachedFriendData);
  if (!cachedFriendData && friendData) {
    console.log(`No cached friend data found for friendId ${friendId}, setting new friend data`);
    cachedFriendData = await setFriend(friendId, friendData);
  }
  return cachedFriendData;
}

async function getFriend(friendId, defaultValueFactory) {
  console.log(`Getting friend data for friendId ${friendId}`);
  let cachedFriendData = await (await getCache()).get(friendId);
  console.log(`Cached friend data for friendId ${friendId}:`, cachedFriendData);
  if (!cachedFriendData && defaultValueFactory) {
    console.log(`No cached friend data found for friendId ${friendId}, using defaultValueFactory`);
    const friendData = await defaultValueFactory(friendId);
    cachedFriendData = await setFriend(friendId, friendData);
  }
  return cachedFriendData;
}

const loadAllFriends = async function ({
  context,
  fields = ['online', 'last_seen', 'can_write_private_message', 'sex', 'bdate', 'deactivated'],
  limit = 10000,
  step = 5000,
}) {
  let friends = [];
  for (let offset = 0; offset < limit; offset += step) {
    console.log(`Loading ${offset}-${offset + step} friends...`);
    const response = await context.vk.api.friends.get({
      fields,
      count: step,
      offset,
    });
    console.log(`${offset}-${offset + step} friends loaded.`);
    await sleep(30000);
    if (response.items.length === 0) {
      break;
    }
    friends = friends.concat(response.items);
  }
  console.log(`All ${friends.length} friends loaded.`);

  for (const friend of friends) {
    await setFriend(friend.id, friend);
  }

  return friends;
}

const getAllFriends = makeCachedFunction(loadAllFriends, { ttl: allFriendsTtlSeconds }, ['context']);

module.exports = {
  getOrSetFriend,
  getFriend,
  setFriend,
  loadAllFriends,
  getAllFriends,
};