const { sleep, getRandomElement, minute, second, ms } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { DateTime } = require('luxon');
const { enqueueMessage } = require('../outgoing-messages');

const messages = [
  "Тебе нравится эта музыка?",
  "Тебе нравится эта композиция?",
  "Тебе нравится этот трек?",
  "Как тебе эта музыка?",
  "Как тебе эта композиция?",
  "Как тебе этот трек?",
  "Что думаешь об этой музыке?",
  "Что думаешь об этой композиции?",
  "Что думаешь об этом треке?",
];

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

async function doYouLikeThisMusic(context) {
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
    await sleep((2 * minute) / ms);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      if (!friend.online) {
        continue;
      }
      console.log(JSON.stringify(friend, null, 2));
      let conversationsResponse;
      //   if (await getConversation(friend.id)) {
      //     console.log(`Skipping friend ${friend.id} because conversation history is not empty or it is not allowed to send message to this friend (data loaded from cache).`);
      //     continue;
      //   } else {
      console.log(`Loading conversations for ${friend.id} friend from server...`);
      conversationsResponse = await context.vk.api.messages.getConversationsById({
          peer_ids: [friend.id],
          count: 1
      });
      const conversation = conversationsResponse.items[0];
      // await setConversation(friend.id, conversation);
      console.log(`Conversation for ${friend.id} friend loaded.`);
      await sleep((40 * second) / ms);

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
      await sleep((20 * second) / ms);

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
          attachment: getRandomElement(audioAttachments),
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
      await sleep((30 * second) / ms);

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
  name: "DoYouLikeThisMusic",
  action: async (context) => {
    return await doYouLikeThisMusic(context);
  }
};

module.exports = {
  trigger
};