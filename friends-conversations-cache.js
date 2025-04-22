const { createCache } = require('cache-manager');
const jsonStore = require('./cache-manager-json-store');
const { eraseMetadata, clean } = require('./utils');

const TTL_SECONDS = 3600; // Time-to-live in seconds
const targetPath = './data/friends/friends-conversations.json';

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

async function setConversation(friendId, conversation) {
  const cleanedConversation = clean(eraseMetadata(conversation));
  console.log(`Setting conversation for friendId ${friendId}:`, cleanedConversation);
  // await (await getCache()).set(friendId, cleanedConversation, { ttl: TTL_SECONDS }); // Use the constant for TTL
  await (await getCache()).set(friendId, cleanedConversation); // Temporary disabling TTL
  return cleanedConversation;
}

async function getOrSetConversation(friendId, conversation) {
  console.log(`Getting or setting conversation for friendId ${friendId}`);
  let cachedConversation = await (await getCache()).get(friendId);
  console.log(`Cached conversation for friendId ${friendId}:`, cachedConversation);
  if (!cachedConversation && conversation) {
    console.log(`No cached conversation found for friendId ${friendId}, setting new conversation`);
    cachedConversation = await setConversation(friendId, conversation);
  }
  return cachedConversation;
}

async function getConversation(friendId, defaultValueFactory) {
  console.log(`Getting conversation for friendId ${friendId}`);
  let cachedConversation = await (await getCache()).get(friendId);
  console.log(`Cached conversation for friendId ${friendId}:`, cachedConversation);
  if (!cachedConversation && defaultValueFactory) {
    console.log(`No cached conversation found for friendId ${friendId}, using defaultValueFactory`);
    const conversation = await defaultValueFactory(friendId);
    cachedConversation = await setConversation(friendId, conversation);
  }
  return cachedConversation;
}

module.exports = {
  getOrSetConversation,
  getConversation,
  setConversation,
};