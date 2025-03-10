const { createCache } = require('cache-manager');
const jsonStore = require('./cache-manager-json-store');
const { eraseMetadata, clean } = require('./utils');

const targetPath = 'friends-conversations.json';
let cache = null;
async function getCache() {
  if (cache) {
    return cache;
  }
  cache = await createCache({ store: (await jsonStore({ filePath: targetPath })), ttl: 3600 /* seconds */ })
  return cache;
};

async function setConversation(friendId, conversation) {
  const cleanedConversation = clean(eraseMetadata(conversation));
  console.log(`Setting conversation for friendId ${friendId}:`, cleanedConversation);
  await (await getCache()).set(friendId, cleanedConversation);
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