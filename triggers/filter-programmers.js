const { getAllFriends } = require('../friends-cache');
const { getOrLoadMessages } = require('../messages-cache');
const { detectProgrammer } = require('../detect-programmer');
const {
  setProgrammerStatus,
  getProgrammerStatus,
  needsCheck,
  markAsAsked,
} = require('../programmer-status-cache');
const { enqueueMessage } = require('../outgoing-messages');
const { sleep, priorityFriendIds, second, ms } = require('../utils');

// Maximum number of friends to check per run
const MAX_FRIENDS_TO_CHECK_PER_RUN = 5;

// Message to ask if they're a programmer (in Russian)
const PROGRAMMER_QUESTION = 'Привет! Подскажи, пожалуйста, ты программист? Это поможет мне лучше организовать список друзей.';

// Alternative question in English
const PROGRAMMER_QUESTION_EN = 'Hi! Could you please tell me, are you a programmer? This will help me better organize my friends list.';

async function filterProgrammers({ vk, options = {} }) {
  try {
    const maxFriendsToCheck = options.maxFriendsToCheck || MAX_FRIENDS_TO_CHECK_PER_RUN;

    console.log('Starting programmer filtering process...');

    // Get all friends
    const allFriends = await getAllFriends({ context: { vk } });
    console.log(`Total friends: ${allFriends.length}`);

    // Filter friends that need to be checked
    const friendsToCheck = [];
    for (const friend of allFriends) {
      // Skip priority friends - they're always safe
      if (priorityFriendIds.includes(friend.id)) {
        console.log(`Skipping priority friend ${friend.id}`);
        continue;
      }

      // Skip deactivated friends
      if (friend.deactivated) {
        console.log(`Skipping deactivated friend ${friend.id}`);
        continue;
      }

      // Check if friend needs to be checked
      if (await needsCheck(friend.id)) {
        friendsToCheck.push(friend);
      }

      // Limit the number of friends to check
      if (friendsToCheck.length >= maxFriendsToCheck) {
        break;
      }
    }

    console.log(`Friends to check in this run: ${friendsToCheck.length}`);

    if (friendsToCheck.length === 0) {
      console.log('No friends need to be checked at this time.');
      return;
    }

    // Process each friend
    for (const friend of friendsToCheck) {
      try {
        console.log(`Checking friend ${friend.id}...`);

        // Load message history
        const messages = await getOrLoadMessages({ context: { vk }, friendId: friend.id });
        console.log(`Loaded ${messages?.length || 0} messages for friend ${friend.id}`);

        if (!messages || messages.length === 0) {
          console.log(`No messages found for friend ${friend.id}, will need to ask directly.`);

          // Ask directly since there's no history
          await askIfProgrammer(vk, friend);
          await markAsAsked(friend.id);

          // Sleep to avoid rate limiting
          await sleep((10 * second) / ms);
          continue;
        }

        // Detect if programmer based on messages
        const detection = detectProgrammer(messages);
        console.log(`Detection result for friend ${friend.id}:`, {
          isProgrammer: detection.isProgrammer,
          confidence: detection.confidence,
          stats: detection.stats,
        });

        if (detection.isProgrammer) {
          // Mark as programmer
          await setProgrammerStatus(friend.id, {
            isProgrammer: true,
            confidence: detection.confidence,
            method: 'auto-detected',
            checkedAt: new Date().toISOString(),
            indicators: detection.indicators,
          });
          console.log(`Friend ${friend.id} identified as programmer (confidence: ${detection.confidence}%)`);
        } else {
          // No clear indication - ask directly
          console.log(`No clear indication for friend ${friend.id}, asking directly...`);
          await askIfProgrammer(vk, friend);
          await markAsAsked(friend.id);
        }

        // Sleep to avoid rate limiting
        await sleep((10 * second) / ms);

      } catch (error) {
        console.error(`Error processing friend ${friend.id}:`, error);
        // Continue with next friend
      }
    }

    console.log('Programmer filtering process completed.');

  } catch (error) {
    console.error('Error in filterProgrammers trigger:', error);
  }
}

/**
 * Send a message asking if the person is a programmer
 * @param {Object} vk - VK API instance
 * @param {Object} friend - Friend object
 */
async function askIfProgrammer(vk, friend) {
  try {
    // Determine language based on friend's language field if available
    const message = PROGRAMMER_QUESTION; // Default to Russian

    console.log(`Asking friend ${friend.id} if they're a programmer...`);

    // Enqueue the message
    enqueueMessage({
      vk,
      request: { peerId: friend.id },
      response: { message },
    });

    console.log(`Question enqueued for friend ${friend.id}`);
  } catch (error) {
    console.error(`Error asking friend ${friend.id} if they're a programmer:`, error);
  }
}

const trigger = {
  name: "FilterProgrammers",
  action: async (context) => {
    return await filterProgrammers(context);
  }
};

module.exports = {
  trigger,
  filterProgrammers,
  askIfProgrammer,
  PROGRAMMER_QUESTION,
  PROGRAMMER_QUESTION_EN,
};
