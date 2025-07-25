const { DateTime } = require('luxon');
const { getRandomElement, sleep, second, ms } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { enqueueMessage } = require('../outgoing-messages');
const { setConversation } = require('../friends-conversations-cache');

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
    await sleep((3 * second) / ms);
    if (requests.items.length <= 0) {
      console.log('No cancelled friendships to react to.');
      return requests;
    }
    for (let i = 0; i < requests.items.length; i++) {
      const friendId = requests.items[i];
      try {
        const conversation = (await context.vk.api.messages.getConversationsById({
          peer_ids: [friendId],
          count: 1
        })).items[0];
        await setConversation(friendId, conversation);
        await sleep((15 * second) / ms);

        if (context?.state?.history) {
          const history = context?.state?.history;
          for (const message of history) {
            if (questions.includes(message.text)) {
              const states = context.states ??= {};
              const friendState = states[friendId] ??= {};
              friendState.reactedToCancelledFriendRequest = true;
            }
          }
        }

        if (context?.states?.[friendId]?.reactedToCancelledFriendRequest) {
          const messages = await context.vk.api.messages.getById({ message_ids: conversation.last_message_id });
          const message = messages.items[0];

          const now = DateTime.now();
          const messageDate = DateTime.fromSeconds(message.date);
          const diff = now.diff(messageDate, 'days').days;
          await sleep((3 * second) / ms);

          const waitDaysLimit = 2;

          if (message.out && diff > waitDaysLimit) {
            await context.vk.api.account.ban({
              owner_id: friendId
            });
            await sleep((3 * second) / ms);
            console.log(`Friend ${friendId} is blocked because there was no answer from this friend for more than ${waitDaysLimit} days, and friendship is cancelled.`);
            continue;
          }
        }

        if (!conversation.can_write.allowed) {
          await context.vk.api.account.ban({
            owner_id: friendId
          });
          await sleep((3 * second) / ms);
          console.log(`Friend ${friendId} is blocked because it is not allowed to send message to this friend, and friendship is cancelled.`);
        } else {
          if (context?.states?.[friendId]?.reactedToCancelledFriendRequest) {
            console.log('Skipping reaction to cancelled friendship for friend', friendId);
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
        }
      } catch (error) {
        console.error(`Could not react to cancelled friendship for friend ${friendId}: ${error}`);
      }
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