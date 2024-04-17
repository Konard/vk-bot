const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { trigger: greetingTrigger } = require('./triggers/greeting');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('./outgoing-messages');
const { sleep } = require('./utils');
const { getConversation, setConversation } = require('./friends-conversations-cache');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const maxFriendsToGreet = Number(process.argv[2]) || 0;
let greetedFriends = 0;

async function greetOnlineFriends() {
  for (let offset = 0; offset < 10000; offset += 5000) {
    console.log(`Loading ${count} friends after offset of ${offset}...`);
    const response = await vk.api.friends.get({
      fields: ['online'],
      count: 5000,
      offset,
    });
    console.log(`Loaded ${count} friends after offset of ${offset}.`);
    await sleep(30000);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      let conversationsResponse;
      if (getConversation(friend.id)) {
        console.log(`Skipping friend ${friend.id} because conversation history is not empty or is not allowed to send message to this friend (data loaded from cache).`);
        continue;
      } else {
        console.log(`Loading conversations for ${friend.id} friend from server...`);
        conversationsResponse = await vk.api.messages.getConversationsById({
          peer_ids: [friend.id],
          count: 1
        });
        console.log(`Conversation for ${friend.id} friend loaded.`);
        await sleep(10000);
      }

      const conversation = conversationsResponse.items[0];

      if (conversation.last_message_id != 0 || conversation.last_conversation_message_id != 0)
      {
        setConversation(friend.id, conversation);

        console.log(`Skipping friend ${friend.id} because conversation history is not empty (data loaded from VK server and saved to cache).`);
        continue;
      }

      if (!conversation.can_write.allowed) {
        setConversation(friend.id, conversation);
        
        console.log(`Skipping friend ${friend.id} because it is not allowed to send message to this friend.`);
        continue;
      }

      await greetingTrigger.action({
        vk,
        response: {
          user_id: friend.id,
        }
      });
      console.log(`Greeting for friend ${friend.id} is added to queue.`);
      await sleep(1000);

      greetedFriends++;
      console.log('greetedFriends:', greetedFriends);
      if (greetedFriends >= maxFriendsToGreet) {
        console.log(`No more friends to greet, ${maxFriendsToGreet} limit reached.`);
        break;
      }
    }
  }
}

if (maxFriendsToGreet > 0) {
  let finished = false;
  greetOnlineFriends().then(() => { 
    finished = true
  }).catch((e) => {
    finished = true;
    console.error(e);
  });
  const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);
  const finalizerInterval = setInterval(() => {
    if (finished && queue.length == 0) {
      setTimeout(() => {
        clearInterval(messagesHandlerInterval);
      }, 10000);
      clearInterval(finalizerInterval);
    }
  }, 1000);
}
