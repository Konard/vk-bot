const _ = require('lodash');
const { sleep, saveJsonSync, hour, second } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { getConversation, setConversation } = require('../friends-conversations-cache');
const { getAllFriends } = require('../friends-cache');

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

async function greetFriends(context) {
  let greetedFriends = 0;
  const maxGreetings = context?.options?.maxGreetings || 0;

  const allFriends = (await getAllFriends({ context }));

  for (let i = 0; i < allFriends.length; i++) {
    const friend = allFriends[i];
    let conversation = await getConversation(friend.id);
    if (!conversation) {
      conversation = await loadConversation(context, friend.id);
      await setConversation(friend.id, conversation);
    }
    const conversationHistoryIsEmpty = conversation.last_message_id === 0 && conversation.last_conversation_message_id === 0;
    allFriends[i] = { ...friend, conversation, conversationHistoryIsEmpty };
  }

  const friendsOpenToMessages = allFriends.filter(friend => friend.can_write_private_message);

  const orderedFriends = _.orderBy(friendsOpenToMessages, ['conversationHistoryIsEmpty', 'online', 'last_seen', 'last_seen.time'], ['desc', 'desc', 'asc', 'desc']);

  // saveJsonSync('orderedFriends.json', orderedFriends);

  const skipFriends = [631154494, 592773712];

  for (const friend of orderedFriends) {
    if (skipFriends.includes(friend.id)) {
      console.log(`Skipping friend ${friend.id} because it is in skip list.`);
      continue;
    }

    let conversation = friend.conversation;

    // Temporary fix for conversation cache (reload conversation from server to check actual state)
    conversation = await loadConversation(context, friend.id);

    console.log(conversation);

    if (conversation.last_message_id > 0 && conversation.last_conversation_message_id > 0) {
      console.log(`Skipping friend ${friend.id} because conversation is not empty.`);
      continue;
    }

    if (conversation.is_marked_unread) {
      console.log(`Skipping friend ${friend.id} because conversation is marked as unread.`);
      continue;
    }

    if (!conversation.can_write.allowed) {
      console.log(`Skipping friend ${friend.id} because it is not allowed to send message to this friend.`);
      continue;
    }

    const response = await greetingTrigger.action({
      vk: context.vk,
      response: {
        user_id: friend.id,
      }
    });
    console.log(`Greeting for friend ${friend.id} is sent:`, response);
    await sleep(30 * second);

    greetedFriends++;
    console.log('greetedFriends:', greetedFriends);

    // Update conversation in cache (after sending greeting)
    await loadConversation(context, friend.id);

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