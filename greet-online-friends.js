const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { greetingTrigger } = require('./triggers/greeting');
const { randomInRange, handleOutgoingMessage, enqueueMessage } = require('./outgoing-messages');
const { sleep } = require('./utils');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

async function greetOnlineFriends() {
  let offset = 0;

  while (true) {
    if (offset >= 10000) {
      break;
    }

    const response = await vk.api.friends.get({
      fields: ['online'],
      count: 5000,
      offset,
    });
    await sleep(10000);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      if (!friend.online || !friend.can_access_closed || friend.is_closed) {
        continue;
      }
      console.log(friend);

      const response = await vk.api.messages.getConversationsById({
        peer_ids: [friend.id],
        count: 1
      });
      await sleep(10000);

      const conversation = response.items[0];

      if (conversation.last_message_id != 0 || conversation.last_conversation_message_id != 0)
      {
        continue;
      }

      greetingTrigger.action({
        vk,
        response: {
          user_id: friend.id,
        }
      });
    }

    offset += 5000;
  }
}

greetOnlineFriends().catch(console.error);

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);