const { second, minute, ms } = require('./time-units');
const { executeTrigger, getToken } = require('./utils');
const { handleOutgoingMessage } = require('./outgoing-messages');

const peers = {}; // TODO: keep state about what triggers then last triggered for each peer

const triggers = [
  // require('./triggers/acquaintance').trigger,
  // require('./triggers/attachments').trigger,
  // require('./triggers/goal').trigger,
  // require('./triggers/gratitude').trigger,
  // require('./triggers/greeting').trigger,
  // require('./triggers/undefined-question').trigger,
  // require('./triggers/well-being').trigger,
  // require('./triggers/who-multiple').trigger,
  // require('./triggers/who-singular').trigger,
  // require('./triggers/have-we-talked-before').trigger,
  // require('./triggers/engage-with-acquaintance').trigger
];

const token = getToken();
const { VK } = require('vk-io');
const vk = new VK({ token });

vk.updates.on(['message_new'], async (request) => {
  let peerState;
  const peerId = request?.peerId;
  if (peers && peerId) {
    peerState = peers[peerId] ??= {};
  }

  if (peerState && !peerState.history) {
    // Load the last 100 messages for the first time
    try {
      const response = await vk.api.messages.getHistory({
        peer_id: peerId,
        count: 100
      });
      // Store the loaded history in the peers object
      peerState.history = response.items;

      // console.log(`History for peer ${peerId} (loaded from server): `, JSON.stringify(peerState.history, null, 2));
    } catch (error) {
      console.error(`An error occurred while loading message history for peer ${peerId}:`, error);
    }
  } else if (peerState) {

    // console.log('Received new message:', JSON.stringify(request, null, 2));

    // Add the incoming message to the history
    // You may need to adjust the message structure below based on the actual VK API response structure
    peerState.history.unshift({
      id: request?.id,
      date: request?.createdAt,
      peer_id: peerId,
      from_id: !request?.isOutbox ? request?.senderId : 0, // -
      text: request?.text,
      out: +request?.isOutbox,
      attachments: request?.attachments, 
      important: request?.isImportant,
      random_id: 0,
      conversation_message_id: request?.conversationMessageId,
      fwd_messages: request?.forwards,
      reply_message: request?.replyMessage,
    });

    // Ensure we only keep the last 100 messages
    peerState.history = peerState.history.slice(0, 100);

    // console.log(`History for peer ${peerId}: (updated by message event)`, JSON.stringify(peerState.history, null, 2));
  }

  for (const trigger of triggers) {
    await executeTrigger(trigger, { vk, request, states: peers });
  }
});

vk.updates.start().catch(console.error);



const { GlobalScheduler } = require('./global-scheduler');
const scheduler = new GlobalScheduler();

const { trigger: setOnlineStatusTrigger } = require('./triggers/set-online-status');
const { trigger: acceptFriendRequestsTrigger } = require('./triggers/accept-friend-requests');
const { trigger: deleteDeactivatedFriendsTrigger } = require('./triggers/delete-deactivated-friends');
const { trigger: deleteOutgoingFriendRequestsTrigger } = require('./triggers/delete-outgoing-requests');
const { trigger: sendInvitationPostsForFriendsTrigger } = require('./triggers/send-invitation-posts-for-friends');
const { trigger: sendBirthDayCongratulationsTrigger } = require('./triggers/send-birthday-congratulations');

scheduler.addScheduledAction('MessagesHandler', null, second / ms, { customAction: handleOutgoingMessage });
scheduler.addScheduledAction('SetOnlineStatus', setOnlineStatusTrigger, (14 * minute) / ms);
scheduler.addScheduledAction('AcceptFriendRequests', acceptFriendRequestsTrigger, (20 * minute) / ms);
scheduler.addScheduledAction('DeleteDeactivatedFriends', deleteDeactivatedFriendsTrigger, (30 * minute) / ms);
scheduler.addScheduledAction('DeleteOutgoingFriendRequests', deleteOutgoingFriendRequestsTrigger, (8 * minute) / ms, { maxRequests: 20 });
scheduler.addScheduledAction('SendInvitationPosts', sendInvitationPostsForFriendsTrigger, (9 * minute) / ms);

let lastBirthday;
const birthdayTriggerWrapper = {
  name: "SendBirthdayCongratulations",
  action: async (context) => {
    const now = new Date();
    const currentDay = now.getDate();
    if (currentDay != lastBirthday) {
      lastBirthday = currentDay;
      await sendBirthDayCongratulationsTrigger.action(context);
    }
  }
};
scheduler.addScheduledAction('SendBirthdayCongratulations', birthdayTriggerWrapper, (23 * 60 * minute) / ms);

scheduler.start({ vk, states: peers });

const sendInvitationPostsForFriendsIntervalAction = async () => {
  await executeTrigger(sendInvitationPostsForFriendsTrigger, { vk });
};
sendInvitationPostsForFriendsIntervalAction();

setInterval(() => {
  scheduler.printStats();
}, (60 * minute) / ms);
