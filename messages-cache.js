const { createCache } = require('cache-manager');
const jsonStore = require('./cache-manager-json-store');
const { eraseMetadata, clean, sleep, week, second, ms } = require('./utils');

const TTL_SECONDS = week / second;
const targetPath = './data/friends/messages/messages.json';
let cache = null;

async function getCache() {
  if (cache) {
    return cache;
  }
  console.log('Initializing messages cache with jsonStore');
  const store = await jsonStore({ filePath: targetPath });
  cache = createCache({
    stores: [store],
  });
  return cache;
}

async function setMessages(friendId, messagesData) {
  console.log(`setMessages called with friendId: ${friendId}`);
  const cleanedMessagesData = clean(eraseMetadata(messagesData));
  console.log(`Setting messages data for friendId ${friendId}:`, cleanedMessagesData);
  const cacheInstance = await getCache();
  console.log(`Messages cache instance obtained:`, cacheInstance);
  await cacheInstance.set(friendId, cleanedMessagesData, { ttl: TTL_SECONDS });
  console.log(`Messages data set for friendId ${friendId}`);
  return cleanedMessagesData;
}

async function getOrSetMessages(friendId, messagesData) {
  console.log(`Getting or setting messages data for friendId ${friendId}`);
  let cachedMessagesData = await (await getCache()).get(friendId);
  console.log(`Cached messages data for friendId ${friendId}:`, cachedMessagesData);
  if (!cachedMessagesData && messagesData) {
    console.log(`No cached messages data found for friendId ${friendId}, setting new messages data`);
    cachedMessagesData = await setMessages(friendId, messagesData);
  }
  return cachedMessagesData;
}

async function getMessages(friendId, defaultValueFactory) {
  console.log(`Getting messages data for friendId ${friendId}`);
  let cachedMessagesData = await (await getCache()).get(friendId);
  console.log(`Cached messages data for friendId ${friendId}:`, cachedMessagesData);
  if (!cachedMessagesData && defaultValueFactory) {
    console.log(`No cached messages data found for friendId ${friendId}, using defaultValueFactory`);
    const messagesData = await defaultValueFactory(friendId);
    cachedMessagesData = await setMessages(friendId, messagesData);
  }
  return cachedMessagesData;
}

async function loadMessages({ context, friendId, step = 200 }) {
  console.log(`Loading message history for friendId ${friendId}...`);
  const messages = [];
  let offset = 0;
  while (true) {
    const response = await context.vk.api.messages.getHistory({
      peer_id: friendId,
      offset,
      count: step,
    });
    await sleep((20 * second) / ms);
    if (response.items.length === 0) {
      break;
    }
    messages.push(...response.items);
    offset += step;
    console.log(`Loaded ${messages.length} messages for friendId ${friendId}`);
  }
  console.log(`Total ${messages.length} messages loaded for friendId ${friendId}`);
  return messages;
}

async function getOrLoadMessages({ context, friendId }) {
  console.log(`Getting or loading messages for friendId ${friendId}...`);
  let messages = await getMessages(friendId, () => loadMessages({ context, friendId }));
  return messages;
}

module.exports = {
  getOrSetMessages,
  getMessages,
  setMessages,
  loadMessages,
  getOrLoadMessages,
};