const { sleep, getRandomElement } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { DateTime } = require('luxon');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('../outgoing-messages');
const { getConversation, setConversation } = require('../friends-conversations-cache');

const messages = [
  "Как я могу помочь?",
  "Я могу чем-то помочь?",
  "Чем я могу быть полезен?",
  "Я могу быть чем-то полезен?",
  "Есть идеи чем я могу быть тебе полезен?",
  "Есть идеи как я могу тебе помочь?",
  "Я могу помочь осуществить тебе мечту?",
  "Я могу быть полезен в осуществлении твоей мечты?",
  "Я могу помочь тебе в достижении твоих целей?",
  "Я могу быть полезен в достижении твоих целей?",
];

async function howCanIHelpYou(context) {
  const maxGreetings = context?.options?.maxGreetings || 0;

  const limit = 10000;
  const step = 5000;
  let friendsProcessed = 0;
  for (let offset = 0; offset < limit; offset += step) {
    console.log(`Loading ${offset}-${offset+step} friends...`);
    const response = await context.vk.api.friends.get({
      fields: ['online', 'sex'],
      count: step,
      offset,
    });
    console.log(`${offset}-${offset+step} friends loaded.`);
    await sleep(40000);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      if (!friend.online) {
        continue;
      }
      console.log(JSON.stringify(friend, null, 2));
      let conversationsResponse;
      //   if (getConversation(friend.id)) {
      //     console.log(`Skipping friend ${friend.id} because conversation history is not empty or it is not allowed to send message to this friend (data loaded from cache).`);
      //     continue;
      //   } else {
      console.log(`Loading conversations for ${friend.id} friend from server...`);
      conversationsResponse = await context.vk.api.messages.getConversationsById({
          peer_ids: [friend.id],
          count: 1
      });
      const conversation = conversationsResponse.items[0];
      // setConversation(friend.id, conversation);
      console.log(`Conversation for ${friend.id} friend loaded.`);
      await sleep(40000);

      if (conversation.last_message_id == 0 || conversation.last_conversation_message_id == 0)
      {
        console.log(`Skipping friend ${friend.id} because conversation history is empty.`);
        continue;
      }

      const conversationMessages = await context.vk.api.messages.getById({ message_ids: conversation.last_message_id });
      const lastMessage = conversationMessages.items[0];

      const now = DateTime.now();
      const lastMessageDate = DateTime.fromSeconds(lastMessage.date);
      const diff = now.diff(lastMessageDate, 'days').days;
      const minimumInterval = 31;
      await sleep(20000);

      if (diff < minimumInterval) {
        console.log(`Skipping friend ${friend.id} because last message with this friend was less than ${minimumInterval} days ago.`);
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
      enqueueMessage({
        vk: context.vk,
        response: {
          user_id: friend.id,
          message: getRandomElement(messages),
        }
      });
      console.log(`Greeting for friend ${friend.id} is added to queue.`);
      await sleep(30000);

      friendsProcessed++;
      console.log('friendsProcessed:', friendsProcessed);
      if (friendsProcessed >= maxGreetings) {
        console.log(`No more friends to greet, ${maxGreetings} limit reached.`);
        return;
      }
    }
  }
}

const trigger = {
  name: "HowCanIHelpYou",
  action: async (context) => {
    return await howCanIHelpYou(context);
  }
};

module.exports = {
  trigger
};