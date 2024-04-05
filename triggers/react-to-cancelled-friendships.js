const { getRandomElement, sleep } = require('../utils');
const { trigger: greetingTrigger } = require('./triggers/greeting');
const { enqueueMessage } = require('../outgoing-messages');

const questions = [
  'Почему не хочешь больше дружить?'
];

async function reactToCancelledFriendships(context) {
  try {
    const count = context?.options?.maxRequests;
    if (count <= 0) {
      return;
    }
    const requests = await context.vk.api.friends.getRequests({ count, out: 1, need_viewed: 1 });
    if (requests.items.length <= 0) {
      console.log('No outgoing friend requests to be deleted');
      return requests;
    }
    for (let i = 0; i < requests.items.length; i++) {
      const friendId = requests.items[i];
      try {
        if (context?.states?.[friendId]?.reactedToCancelledFriendRequest) {
          continue;
        }

        await greetingTrigger.action({
          vk: context.vk,
          response: {
            user_id: friendId,
          }
        });
        enqueueMessage({
          vk: context.vk,
          response: {
            user_id: friendId,
            message: getRandomElement(questions),
          }
        });

        const states = context.states ??= {};
        const friendState = states[friendId] ??= {};
        friendState.reactedToCancelledFriendRequest = true;

        console.log('Reacted to cancelled friendship for friend', friendId);
      } catch (error) {
        console.error(`Could not react to cancelled friendship for friend ${friendId}: ${error}`);
      }
      await sleep(3000);
    }
    return requests;
  } catch (error) {
    console.error(`Could not react to cancelled friendships: ${error}`);
  }
}

const trigger = {
  name: "ReactToCancelledFriendship",
  action: async (context) => {
    return await reactToCancelledFriendships(context);
  }
};

module.exports = {
  trigger
};