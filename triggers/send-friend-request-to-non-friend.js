const { getAllFriends } = require('../friends-cache');
const { sleep, second, minute, ms } = require('../utils');
const { DateTime } = require('luxon');

const trigger = {
  name: "SendFriendRequestToNonFriend",
  condition: async (context) => {
    // Only process messages from users (not groups/chats)
    if (context.request.peerType !== "user") {
      return false;
    }

    // Only process incoming messages (not outgoing)
    if (context?.request?.isOutbox) {
      return false;
    }

    // Check if we've already processed this user recently (within 7 days)
    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;

    if (lastTriggeredDiff < 7) {
      console.log(`Already processed friend request for user ${context.request.senderId} ${lastTriggeredDiff.toFixed(2)} days ago.`);
      return false;
    }

    return true;
  },
  action: async (context) => {
    const senderId = context.request.senderId;

    try {
      // Get all friends to check if sender is already a friend
      const allFriends = await getAllFriends({ context });

      // Check if the sender is already in the friends list
      const isFriend = allFriends.some(friend => friend.id === senderId);

      if (isFriend) {
        console.log(`User ${senderId} is already a friend, no need to send friend request.`);
        return;
      }

      console.log(`User ${senderId} is not a friend, sending friend request...`);

      // Send friend request
      await context.vk.api.friends.add({ user_id: senderId });
      console.log(`Friend request sent to user ${senderId}.`);

      // Small delay to avoid rate limiting
      await sleep((2 * second) / ms);

    } catch (error) {
      if (error.code === 174) {
        // User is already in friends or friend request already sent
        console.log(`User ${senderId} already has a pending friend request or is already a friend.`);
      } else if (error.code === 177) {
        // Cannot add this user to friends (user not found or deactivated)
        console.log(`Cannot send friend request to user ${senderId}: user not found or deactivated.`);
      } else if (error.code === 242) {
        // Too many friends
        console.log(`Cannot send friend request to user ${senderId}: friends count limit (10000) exceeded.`);
      } else if (error.code === 29) {
        // Rate limit reached
        console.log(`Cannot send friend request to user ${senderId}: rate limit reached.`);
      } else if (error.code === 15) {
        // Access denied (user's privacy settings)
        console.log(`Cannot send friend request to user ${senderId}: access denied due to privacy settings.`);
      } else {
        console.error(`Error sending friend request to user ${senderId}:`, error);
      }
    }
  }
};

module.exports = {
  trigger
};
