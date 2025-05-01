const _ = require('lodash');
const { sleep, saveJsonSync, hour, second } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { getOrLoadConversation, getConversation, setConversation, loadConversation } = require('../friends-conversations-cache');
const { getAllFriends } = require('../friends-cache');
const { getOrLoadMessages, loadMessages } = require('../messages-cache');



async function greetFriends(context) {
  let greetedFriends = 0;
  const maxGreetings = context?.options?.maxGreetings || 0;

  const allFriends = (await getAllFriends({ context }));

  for (let i = 0; i < allFriends.length; i++) {
    const friend = allFriends[i];
    let conversation = await getOrLoadConversation({ context, friendId: friend.id });
    const conversationHistoryIsEmpty = conversation.last_message_id === 0 && conversation.last_conversation_message_id === 0;
    let lastMessageTimestamp;
    if (!conversationHistoryIsEmpty) {
      const messages = await getOrLoadMessages({ context, friendId: friend.id });
      lastMessageTimestamp = messages[0]?.date;
    }
    allFriends[i] = { ...friend, conversation, conversationHistoryIsEmpty, lastMessageTimestamp };
    console.log(`Friend ${i+1}/${allFriends.length} processed:`, {
      conversationHistoryIsEmpty,
      lastMessageTimestamp,
    });
  }

  const friendsOpenToMessages = allFriends.filter(friend => friend.can_write_private_message);

  const orderedFriends = _.orderBy(friendsOpenToMessages, ['conversationHistoryIsEmpty', 'lastMessageTimestamp'], ['desc', 'asc']);

  // saveJsonSync('orderedFriends.json', orderedFriends);

  const skipFriends = [631154494, 592773712];

  for (const friend of orderedFriends) {
    if (skipFriends.includes(friend.id)) {
      console.log(`Skipping friend ${friend.id} because it is in skip list.`);
      continue;
    }

    let conversation = friend.conversation;

    // Temporary fix for conversation cache (reload conversation from server to check actual state)
    conversation = await loadConversation({ context, friendId: friend.id });
    await loadMessages({ context, friendId: friend.id });

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

    await greetingTrigger.action({
      vk: context.vk,
      response: {
        user_id: friend.id,
      }
    });
    greetedFriends++;
    console.log(`Greeting for ${greetedFriends}/${maxGreetings} friend with id ${friend.id} is sent.`);
    await sleep(30 * second);

    // Update conversation in cache (after sending greeting)
    await loadConversation({ context, friendId: friend.id });
    await loadMessages({ context, friendId: friend.id });

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