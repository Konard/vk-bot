const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { eraseMetadata, clean, sleep, second } = require('./utils');

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
  // console.log(`Setting conversation for friendId ${friendId}:`, cleanedConversation);
  // await (await getCache()).set(friendId, cleanedConversation, { ttl: TTL_SECONDS }); // Use the constant for TTL
  await (await getCache()).set(friendId, cleanedConversation); // Temporary disabling TTL
  return cleanedConversation;
}

async function getOrSetConversation(friendId, conversation) {
  // console.log(`Getting or setting conversation for friendId ${friendId}`);
  let cachedConversation = await (await getCache()).get(friendId);
  // console.log(`Cached conversation for friendId ${friendId}:`, cachedConversation);
  if (!cachedConversation && conversation) {
    console.log(`No cached conversation found for friendId ${friendId}, setting new conversation`);
    cachedConversation = await setConversation(friendId, conversation);
  }
  return cachedConversation;
}

async function getConversation(friendId, defaultValueFactory) {
  // console.log(`Getting conversation for friendId ${friendId}`);
  let cachedConversation = await (await getCache()).get(friendId);
  // console.log(`Cached conversation for friendId ${friendId}:`, cachedConversation);
  if (!cachedConversation && defaultValueFactory) {
    console.log(`No cached conversation found for friendId ${friendId}, using defaultValueFactory`);
    const conversation = await defaultValueFactory(friendId);
    cachedConversation = await setConversation(friendId, conversation);
  }
  return cachedConversation;
}

const loadConversation = async function ({ context, friendId }) {
  console.log(`Loading conversations for ${friendId} friend from server...`);
  const conversationsResponse = await context.vk.api.messages.getConversationsById({
    peer_ids: [friendId],
    count: 1
  });
  const conversation = conversationsResponse.items[0];
  if (!conversation) {
    setConversation(friendId, conversation);
  }
  console.log(`Conversation for ${friendId} friend loaded from VK.`);
  await sleep(10 * second);
  return conversation;
}

async function getOrLoadConversation({ context, friendId }) {
  console.log(`Getting or loading conversation for friendId ${friendId}...`);
  let conversation = await getConversation(friendId, () => loadConversation({ context, friendId }));
  return conversation;
}

module.exports = {
  getOrLoadConversation,
  getOrSetConversation,
  getConversation,
  setConversation,
  loadConversation,
};