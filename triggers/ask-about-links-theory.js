const { sleep } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { getConversation, setConversation } = require('../friends-conversations-cache');

const message = "Какой первый символ или слово тебе не понятны в теории связей?";

async function askAboutLinksTheory(context) {
  const maxGreetings = context?.options?.maxGreetings || 0;

  const limit = 10000;
  const step = 5000;
  let greetedFriends = 0;
  for (let offset = 0; offset < limit; offset += step) {
    console.log(`Loading ${offset}-${offset+step} friends...`);
    const response = await context.vk.api.friends.get({
      fields: ['online', 'sex'],
      count: step,
      offset,
    });
    console.log(`${offset}-${offset+step} friends loaded.`);
    await sleep(30000);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      console.log(JSON.stringify(friend))
      if (!friend.online) {
        continue;
      }
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
      await sleep(10000);
      //   }      

      //   if (conversation.last_message_id != 0 || conversation.last_conversation_message_id != 0)
      //   {
      //     // setConversation(friend.id, conversation);

      //     console.log(`Skipping friend ${friend.id} because conversation history is not empty (data loaded from VK server and saved to cache).`);
      //     continue;
      //   }

      if (!conversation.can_write.allowed) {
        // setConversation(friend.id, conversation);
        
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
          message
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
}

const trigger = {
  name: "AskAboutLinksTheory",
  action: async (context) => {
    return await askAboutLinksTheory(context);
  }
};

module.exports = {
  trigger
};