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

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      if (friend.online) {
        console.log(friend);

        const response = await vk.api.messages.getConversations({
          user_ids: [friend.id],
          count: 1
        });

        const lastMessage = response.items[0].last_message;
        console.log('Here is the latest message: ', lastMessage);

        await sleep(2000);

        greetingTrigger.action({
          vk,
          response: {
            user_id: friend.id,
          }
        });
      }
    }

    offset += 5000;
  }
}

greetOnlineFriends().catch(console.error);

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);



.catch(console.error);