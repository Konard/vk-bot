const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { greetingTrigger } = require('./triggers/greeting');
const { randomInRange, handleOutgoingMessage, enqueueMessage } = require('./outgoing-messages');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

async function greetOnlineFriends() {
  let offset = 0;
  // const currentDate = new Date();
  // const currentDay = currentDate.getDate();
  // const currentMonth = currentDate.getMonth() + 1;

  while (true) {
    if (offset >= 10000) {
      break;
    }

    const response = await vk.api.friends.get({
      fields: ['bdate', 'online'],
      count: 5000,
      offset,
    });

    console.log('response.items.length', response.items.length);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      if (friend.online) {
        console.log(friend);
        greetingTrigger.action({
          vk,
          response: {
            user_id: friend.id,
          }
        });
        // return;
        // if (friend.bdate) {
        //   const [day, month] = friend.bdate.split('.');
        //   if (day == currentDay && month == currentMonth) {
        //     console.log('friend.id', friend.id);
        //     enqueueMessage({
        //       vk,
        //       response: {
        //         user_id: friend.id,
        //         sticker_id: getRandomElement(birthdayStickerIds),
        //       }
        //     });
        //     enqueueMessage({
        //       vk,
        //       response: {
        //         user_id: friend.id,
        //         message: getRandomElement(birthdayCongratulations)
        //       }
        //     });
        //   }
        // }
      }

    }

    offset += 5000;
  }
}

greetOnlineFriends().catch(console.error);

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);