const { getRandomElement, sleep } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');
const { enqueueMessage } = require('../outgoing-messages');
const fs = require('fs');

const questions = [
  'Почему не хочешь больше дружить?'
];

const targetPath = 'friends-conversations.json';

let friendsConversations = {};
if (fs.existsSync(targetPath)) {
  friendsConversations = JSON.parse(fs.readFileSync(targetPath));
  console.log('Object.keys(friendsConversations).length', Object.keys(friendsConversations).length)
}

function clean(obj) {
  for (var propName in obj) { 
    if (obj[propName] === null || obj[propName] === undefined || obj[propName]?.length === 0) {
      delete obj[propName];
    }
    // if(typeof obj[propName] === 'object'){
    //   clean(obj[propName]); //recursive for nested objects
    // }
  }
  return obj;
}

function eraseMetadata(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function saveToFile() {
  fs.writeFileSync(targetPath, JSON.stringify(friendsConversations, null, 2));
}

async function reactToCancelledFriendships(context) {
  try {
    const count = context?.options?.maxRequests;
    if (count <= 0) {
      return;
    }
    const requests = await context.vk.api.friends.getRequests({ count, out: 1, need_viewed: 1 });
    await sleep(3000);
    if (requests.items.length <= 0) {
      console.log('No cancelled friendships to react to.');
      return requests;
    }
    for (let i = 0; i < requests.items.length; i++) {
      const friendId = requests.items[i];
      try {
        let conversation;
        // if (friendsConversations[friendId]) {
        //   conversation = friendsConversations[friendId];
        // } else {

        conversation = (await context.vk.api.messages.getConversationsById({
          peer_ids: [friendId],
          count: 1
        })).items[0];
        friendsConversations[friendId] = clean(eraseMetadata(conversation));
        saveToFile();
        await sleep(20000);
        
        // }

        if (!conversation.can_write.allowed) {
          await context.vk.api.account.ban({
            owner_id: friendId
          });
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