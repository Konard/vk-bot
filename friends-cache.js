const { createCache } = require('cache-manager');
const jsonStore = require('./cache-manager-json-store');
const { eraseMetadata, clean } = require('./utils');

const TTL_SECONDS = 3600; // Time-to-live in seconds
const targetPath = './data/friends/friends.json';
let cache = null;

async function getCache() {
  if (cache) {
    return cache;
  }
  console.log('Initializing cache with jsonStore');
  const store = await jsonStore({ filePath: targetPath });
  console.log('jsonStore initialized:', store);

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

module.exports = {
  getOrSetFriend,
  getFriend,
  setFriend,
};