const { getAllFriends, loadAllFriends } = require('../friends-cache');
const { enqueueMessage } = require('../outgoing-messages');
const { sleep, second, ms } = require('../utils');

// Store to track friends we've already welcomed
const welcomedFriends = new Set();

const welcomeMessage = "Привет! Я программист и буду рад помочь с вопросами по программированию и автоматизации. Просто напиши, если что-то нужно!";

async function welcomeNewFriends({ vk }) {
  try {
    console.log('Checking for new friends to welcome...');

    // Get current friends list
    const allFriends = await getAllFriends({ context: { vk } });

    if (!allFriends || allFriends.length === 0) {
      console.log('No friends found to check for welcoming.');
      return;
    }

    let newFriendsCount = 0;

    for (const friend of allFriends) {
      // Skip if we already welcomed this friend
      if (welcomedFriends.has(friend.id)) {
        continue;
      }

      // Skip if friend doesn't allow private messages
      if (!friend.can_write_private_message) {
        console.log(`Skipping friend ${friend.id} - cannot write private messages.`);
        welcomedFriends.add(friend.id); // Mark as "welcomed" to avoid checking again
        continue;
      }

      // Skip if friend is deactivated
      if (friend.deactivated) {
        console.log(`Skipping friend ${friend.id} - account is deactivated.`);
        welcomedFriends.add(friend.id); // Mark as "welcomed" to avoid checking again
        continue;
      }

      console.log(`Sending welcome message to new friend ${friend.id}...`);

      // Queue the welcome message
      enqueueMessage({
        vk,
        response: {
          user_id: friend.id,
          message: welcomeMessage,
          random_id: Math.random()
        }
      });

      // Mark this friend as welcomed
      welcomedFriends.add(friend.id);
      newFriendsCount++;

      console.log(`Welcome message queued for friend ${friend.id}.`);

      // Add a small delay between messages to avoid rate limiting
      await sleep((5 * second) / ms);
    }

    if (newFriendsCount === 0) {
      console.log('No new friends to welcome.');
    } else {
      console.log(`Welcome messages queued for ${newFriendsCount} new friends.`);
    }

  } catch (error) {
    console.error('Could not welcome new friends:', error);
  }
}

const trigger = {
  name: "WelcomeNewFriends",
  action: async (context) => {
    return await welcomeNewFriends(context);
  }
};

module.exports = {
  trigger
};