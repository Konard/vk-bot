const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { trigger: greetingTrigger } = require('./triggers/greeting');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('./outgoing-messages');
const { sleep } = require('./utils');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const maxFriendsToGreet = Number(process.argv[2]) || 0;
let greetedFriends = 0;

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

async function greetOnlineFriends() {
  for (let offset = 0; offset < 10000; offset += 5000) {
    const response = await vk.api.friends.get({
      fields: ['online'],
      count: 5000,
      offset,
    });
    await sleep(30000);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
//       if (!friend.can_access_closed) {
//         console.log(`Skipping friend ${friend.id}:
// friend.can_access_closed == ${friend.can_access_closed};
// friend.is_closed == ${friend.is_closed}.`)
//         continue;
//       }
      console.log(friend);

      console.log(`Loading conversations for ${friend.id} friend.`)
      if (friendsConversations[friend.id]) {
        console.log(`Skipping friend ${friend.id} because conversation history is not empty (data loaded from cache).`);
        continue;
      } else {
        const response = await vk.api.messages.getConversationsById({
          peer_ids: [friend.id],
          count: 1
        });
        await sleep(20000);
      }

      const conversation = response.items[0];

      if (conversation.last_message_id != 0 || conversation.last_conversation_message_id != 0)
      {
        friendsConversations[friend.id] = clean(eraseMetadata(conversation));
        saveToFile();

        console.log(`Skipping friend ${friend.id} because conversation history is not empty (data loaded from VK server and saved to cache).`);
        continue;
      }

      await greetingTrigger.action({
        vk,
        response: {
          user_id: friend.id,
        }
      });

      console.log(`Greeting for friend ${friend.id} is added to queue.`);

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
