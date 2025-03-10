const _ = require('lodash');
const { sleep, saveJsonSync } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { getConversation, setConversation } = require('../friends-conversations-cache');

const loadConversation = async function (context, friendId) {
  console.log(`Loading conversations for ${friendId} friend from server...`);
  const conversationsResponse = await context.vk.api.messages.getConversationsById({
    peer_ids: [friendId],
    count: 1
  });
  console.log(`Conversation for ${friendId} friend loaded from VK.`);
  await sleep(10000);
  return conversationsResponse.items[0];
}

const loadAllFriends = async function ({
  context,
  fields = ['online', 'last_seen', 'can_write_private_message'],
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

  // saveJsonSync('friends.json', friends);

  return friends;
}

async function greetFriends(context) {
  let greetedFriends = 0;
  const maxGreetings = context?.options?.maxGreetings || 0;

  const allFriends = await loadAllFriends({ context });

  const friendsOpenToMessages = allFriends.filter(friend => friend.can_write_private_message);

  const orderedFriends = _.orderBy(friendsOpenToMessages, ['online', 'last_seen', 'last_seen.time'], ['desc', 'asc', 'desc']);

  // saveJsonSync('orderedFriends.json', orderedFriends);

  for (const friend of orderedFriends) {
    let conversation;
    if (await getConversation(friend.id)) {
      console.log(`Skipping friend ${friend.id} because conversation history is not empty or it is not allowed to send message to this friend (data loaded from cache).`);
      continue;
    } else {
      conversation = await loadConversation(context, friend.id);
    }

    if (conversation.last_message_id != 0 || conversation.last_conversation_message_id != 0) {
      console.log(`Skipping friend ${friend.id} because conversation history is not empty.`);
      await setConversation(friend.id, conversation);
      continue;
    }

    if (conversation.is_marked_unread) {
      console.log(`Skipping friend ${friend.id} because conversation is marked as unread.`);
      await setConversation(friend.id, conversation);
      continue;
    }

    if (!conversation.can_write.allowed) {
      console.log(`Skipping friend ${friend.id} because it is not allowed to send message to this friend.`);
      await setConversation(friend.id, conversation);
      continue;
    }

    await greetingTrigger.action({
      vk: context.vk,
      response: {
        user_id: friend.id,
      }
    });
    console.log(`Greeting for friend ${friend.id} is added to queue.`);
    await sleep(1000);

    greetedFriends++;
    console.log('greetedFriends:', greetedFriends);
    if (greetedFriends >= maxGreetings) {
      console.log(`No more friends to greet, ${maxGreetings} limit reached.`);
      return;
    }
  }
}

const trigger = {
  name: "GreetFriends",
  action: async (context) => {
    return await greetFriends(context);
  }
};

module.exports = {
  trigger
};