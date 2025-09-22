const { getRandomElement, sleep, second, ms } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { getAllFriends } = require('../friends-cache');

// Sticker IDs for different categories
const generalStickerIds = [
  60302,  // General greeting
  89461,  // Good mood
  92727,  // Positive message
  72627,  // Friendly
  56507,  // Happy
  59429,  // Cheerful
];

// Message templates for males (sex = 2)
const maleMessageTemplates = [
  "Привет! 👋 Как дела, друг?",
  "Здорово! Как поживаешь? 🤝",
  "Привет, братан! Как успехи? 💪",
  "Йо! Как твои дела? 🔥",
  "Привет! Надеюсь, всё отлично! 😎",
  "Здарова! Как настроение? 🚀",
  "Привет, товарищ! Как жизнь? ⚡",
];

// Message templates for females (sex = 1)
const femaleMessageTemplates = [
  "Привет! 👋 Как дела, подруга?",
  "Привет, красавица! Как поживаешь? ✨",
  "Привет! Как настроение? 🌸",
  "Здравствуй! Надеюсь, всё замечательно! 💖",
  "Привет, солнышко! Как успехи? 🌺",
  "Привет! Как твои дела? 🦋",
  "Здорово! Как жизнь? 🌷",
];

// Default message templates (sex = 0 or unknown)
const defaultMessageTemplates = [
  "Привет! 👋 Как дела?",
  "Здорово! Как поживаешь? 😊",
  "Привет! Как настроение? 🌟",
  "Здравствуй! Надеюсь, всё отлично! ✨",
  "Привет! Как успехи? 🚀",
  "Йо! Как твои дела? 👍",
  "Привет! Как жизнь? 😄",
];

/**
 * Check if a user is a member of specific communities
 * @param {Object} vk - VK API instance
 * @param {number} userId - User ID to check
 * @param {number[]} communityIds - Array of community IDs to check
 * @returns {Promise<boolean>} - True if user is member of any specified community
 */
async function isUserInCommunities(vk, userId, communityIds) {
  try {
    for (const communityId of communityIds) {
      const response = await vk.api.groups.isMember({
        group_id: communityId,
        user_id: userId
      });

      if (response === 1) { // 1 means the user is a member
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking community membership for user ${userId}:`, error);
    return false; // Assume not a member if error occurs
  }
}

/**
 * Get appropriate message template based on user's gender
 * @param {number} sex - User's sex (1=female, 2=male, 0=not specified)
 * @returns {string} - Random message template
 */
function getMessageForGender(sex) {
  switch (sex) {
    case 1: // Female
      return getRandomElement(femaleMessageTemplates);
    case 2: // Male
      return getRandomElement(maleMessageTemplates);
    default: // Unknown or not specified
      return getRandomElement(defaultMessageTemplates);
  }
}

/**
 * Send messages or stickers to friends who are members of specific communities
 * @param {Object} context - Context object containing vk instance and options
 */
async function sendCommunityMessages(context) {
  const { vk, options = {} } = context;

  // Configuration options
  const {
    communityIds = [], // Array of community IDs to check
    maxMessages = 10, // Maximum number of messages to send
    sendStickers = false, // Whether to send stickers instead of text
    includeSticker = false, // Whether to include sticker with text message
    delayBetweenChecks = 1000, // Delay between community membership checks (ms)
  } = options;

  if (communityIds.length === 0) {
    console.log('No community IDs specified. Skipping.');
    return;
  }

  console.log(`Starting to send messages to friends in communities: ${communityIds.join(', ')}`);
  console.log(`Max messages: ${maxMessages}, Send stickers: ${sendStickers}, Include sticker: ${includeSticker}`);

  const allFriends = await getAllFriends({ context });
  const friendsInCommunities = [];
  let checkedFriends = 0;

  // Filter friends who are members of specified communities
  for (const friend of allFriends) {
    if (!friend.can_write_private_message) {
      console.log(`Skipping friend ${friend.id} - cannot write private messages`);
      continue;
    }

    if (friend.deactivated) {
      console.log(`Skipping friend ${friend.id} - account is deactivated`);
      continue;
    }

    checkedFriends++;
    console.log(`Checking community membership for friend ${friend.id} (${checkedFriends}/${allFriends.length})`);

    const isMember = await isUserInCommunities(vk, friend.id, communityIds);

    if (isMember) {
      friendsInCommunities.push(friend);
      console.log(`Friend ${friend.id} is a member of one of the specified communities`);
    }

    // Add delay between checks to avoid rate limiting
    if (delayBetweenChecks > 0) {
      await sleep(delayBetweenChecks / ms);
    }
  }

  console.log(`Found ${friendsInCommunities.length} friends in specified communities`);

  if (friendsInCommunities.length === 0) {
    console.log('No friends found in specified communities.');
    return;
  }

  // Shuffle friends to randomize sending order
  const shuffledFriends = friendsInCommunities.sort(() => Math.random() - 0.5);
  const friendsToMessage = shuffledFriends.slice(0, maxMessages);

  console.log(`Sending messages to ${friendsToMessage.length} friends...`);

  let sentMessages = 0;

  for (const friend of friendsToMessage) {
    try {
      if (sendStickers) {
        // Send only sticker
        const stickerId = getRandomElement(generalStickerIds);
        await enqueueMessage({
          peer_id: friend.id,
          sticker_id: stickerId,
        });
        console.log(`Sticker ${stickerId} queued for friend ${friend.id}`);
      } else {
        // Send text message
        const messageText = getMessageForGender(friend.sex);
        const messageData = {
          peer_id: friend.id,
          message: messageText,
        };

        // Optionally include a sticker with the text message
        if (includeSticker) {
          messageData.sticker_id = getRandomElement(generalStickerIds);
        }

        await enqueueMessage(messageData);
        console.log(`Message "${messageText}" queued for friend ${friend.id} (sex: ${friend.sex})`);
      }

      sentMessages++;

      // Add delay between message queuing
      await sleep((2 * second) / ms);

    } catch (error) {
      console.error(`Error sending message to friend ${friend.id}:`, error);
    }
  }

  console.log(`Successfully queued ${sentMessages} messages to friends in specified communities`);
}

const trigger = {
  name: "SendCommunityMessages",
  action: async (context) => {
    return await sendCommunityMessages(context);
  }
};

module.exports = {
  trigger,
  sendCommunityMessages,
  isUserInCommunities,
  getMessageForGender,
};