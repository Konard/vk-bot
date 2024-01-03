// const fs = require('fs');
const { VK } = require('vk-io');
const { DateTime } = require('luxon');
const { handleOutgoingMessage, enqueueMessage } = require('./outgoing-messages');
const { acquaintanceTrigger } = require('./triggers/acquaintance');
const { attachmentsTrigger } = require('./triggers/attachments');
const { goalTrigger } = require('./triggers/goal');
const { gratitudeTrigger } = require('./triggers/gratitude');
const { greetingTrigger } = require('./triggers/greeting');
const { undefinedQuestionTrigger } = require('./triggers/undefined-question');
const { wellBeingTrigger } = require('./triggers/well-being')

const { hasSticker, getRandomElement, sleep } = require('./utils');

const peers = {}; // TODO: keep state about what triggers then last triggered for each peer

const triggers = [
  acquaintanceTrigger,
  attachmentsTrigger,
  goalTrigger,
  gratitudeTrigger,
  greetingTrigger,
  undefinedQuestionTrigger,
  wellBeingTrigger,
  require('./triggers/who-multiple').trigger,
  require('./triggers/who-singular').trigger,
];

const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

// let self;
// async function getSelf() {
//   const [user] = await vk.api.users.get({});
//   console.log('self', JSON.stringify(user));
//   self = user;
// }
// getSelf().catch(console.error);

vk.updates.on(['message_new'], (request) => {
  // console.log('request.isGroup', request.isGroup);
  // console.log('request.isFromGroup', request.isFromGroup);
  // console.log('request.isUser', request.isUser);
  // console.log('request.isFromUser', request.isFromUser);
  if (!request.isFromUser) {
    return;
  }
  console.log('request', JSON.stringify(request, null, 2));

  const state = peers[request.peerId];
  console.log('state', state);
  let reactionTriggered = false;
  for (const trigger of triggers) {
    if (!trigger.condition || trigger.condition({ vk, request, state })) {
      trigger.action({ vk, request, state });
      reactionTriggered = true;
      if (trigger.name) {
        const peer = peers[request.peerId] ??= {};
        const triggers = peer.triggers ??= {};
        const triggerState = triggers[trigger.name] ??= {};
        triggerState.lastTriggered = DateTime.now();
        console.log('peers', JSON.stringify(peers, null, 2));
      }
    }
  }
  if (reactionTriggered) {
    const userId = request.senderId; // The user who sent a message
    vk.api.messages.markAsRead({
      peer_id: userId,
      start_message_id: request.id // Get the id of the new message
    }).catch(console.error);
  }
});

vk.updates.start().catch(console.error);

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);

const minute = 60 * 1000;

const setOnlineInterval = setInterval(async () => {
  try {
    await vk.api.account.setOnline();
    console.log('Online status is set');
  } catch (e) {
    console.log('Could not set online status', e);
  }
}, 14 * minute);

const acceptFriendRequestsInterval = setInterval(async () => {
  try {
    const requests = await vk.api.friends.getRequests({ count: 23 });
    for (let i = 0; i < requests.items.length; i++) {
      await vk.api.friends.add({ user_id: requests.items[i], text: '' });
      await sleep(3000);
    }
    if (requests?.items?.length <= 0) {
      console.log('No incoming friend requests to be accepted');
    } else {
      console.log('Incoming friend requests accepted:', JSON.stringify(requests, null, 2));
    }
  } catch (e) {
    console.log('Could not accept friend requests:', e);
  }
}, 5 * minute);

const deleteDeactivatedFriendsInterval = setInterval(async () => {
  const step = 5000;
  const deactivatedValues = ['banned', 'deleted'];
  const deletedFriendsIds = [];
  let offset = 0;
  while (true) {
    try {
      const friends = await vk.api.friends.get({ count: step, offset, fields: ['deactivated'] });
      const deactivatedFriends = friends.items.filter(friend => friend.deactivated && deactivatedValues.includes(friend.deactivated));
      for (const friend of deactivatedFriends) {
        try {
          deletedFriendsIds.push(friend.id);
          await vk.api.friends.delete({ user_id: friend.id });
          console.log('Deactivated friend', friend.id, 'was deleted');
          await sleep(3000);
        } catch (err) {
          console.error(`Failed to delete deactivated friend: ${err}`);
        }
      }
      if (offset + step >= 10000 || friends.items.length < step) {
        if (deletedFriendsIds?.length <= 0) {
          console.log('No deactivated friends to be deleted');
        } else {
          console.log(`Deleted deactivated friends: ${deletedFriendsIds}`);
        }
        break;
      }
      offset += step;
    } catch (err) {
      console.error(`Could not retrieve friends to delete deactivated ones: ${err}`);
    }
  }
}, 20 * minute);