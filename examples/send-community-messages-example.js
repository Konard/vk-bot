const { executeTrigger, getToken } = require('../utils');
const { trigger: sendCommunityMessagesTrigger } = require('../triggers/send-community-messages');
const { VK } = require('vk-io');

// Initialize VK API
const token = getToken();
const vk = new VK({ token });

/**
 * Example usage of the send-community-messages trigger
 */
async function main() {
  console.log('🚀 Starting community messages example...\n');

  // Example 1: Send text messages to friends in specific communities
  console.log('📝 Example 1: Sending gender-specific text messages');
  await executeTrigger(sendCommunityMessagesTrigger, {
    vk,
    options: {
      communityIds: [54530371, 12345678], // Replace with actual community IDs
      maxMessages: 5, // Send to maximum 5 friends
      sendStickers: false, // Send text messages
      includeSticker: false, // Don't include stickers with text
      delayBetweenChecks: 500, // 500ms delay between community checks
    }
  });

  console.log('\n⏳ Waiting before next example...\n');
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

  // Example 2: Send only stickers to friends in communities
  console.log('🎨 Example 2: Sending only stickers');
  await executeTrigger(sendCommunityMessagesTrigger, {
    vk,
    options: {
      communityIds: [54530371], // Single community ID
      maxMessages: 3, // Send to maximum 3 friends
      sendStickers: true, // Send only stickers
      includeSticker: false, // This option is ignored when sendStickers is true
      delayBetweenChecks: 1000, // 1 second delay between community checks
    }
  });

  console.log('\n⏳ Waiting before next example...\n');
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

  // Example 3: Send text messages with stickers to friends in communities
  console.log('💫 Example 3: Sending text messages with stickers');
  await executeTrigger(sendCommunityMessagesTrigger, {
    vk,
    options: {
      communityIds: [54530371, 87654321], // Multiple community IDs
      maxMessages: 7, // Send to maximum 7 friends
      sendStickers: false, // Send text messages
      includeSticker: true, // Include stickers with text messages
      delayBetweenChecks: 750, // 750ms delay between community checks
    }
  });

  console.log('\n✅ All examples completed!');
}

// Handle script arguments for different modes
const args = process.argv.slice(2);
const mode = args[0] || 'text';
const communityId = parseInt(args[1]) || 54530371;
const maxMessages = parseInt(args[2]) || 5;

async function runMode() {
  console.log(`🎯 Running in ${mode} mode for community ${communityId}, max messages: ${maxMessages}\n`);

  const baseOptions = {
    communityIds: [communityId],
    maxMessages: maxMessages,
    delayBetweenChecks: 1000,
  };

  let options;
  switch (mode) {
    case 'stickers':
      options = {
        ...baseOptions,
        sendStickers: true,
        includeSticker: false,
      };
      break;
    case 'combined':
      options = {
        ...baseOptions,
        sendStickers: false,
        includeSticker: true,
      };
      break;
    case 'text':
    default:
      options = {
        ...baseOptions,
        sendStickers: false,
        includeSticker: false,
      };
      break;
  }

  await executeTrigger(sendCommunityMessagesTrigger, { vk, options });
}

// If arguments are provided, run in specific mode, otherwise run all examples
if (args.length > 0) {
  runMode().catch(console.error);
} else {
  main().catch(console.error);
}

/**
 * Usage examples:
 *
 * Run all examples:
 * node examples/send-community-messages-example.js
 *
 * Send text messages to community 54530371 (max 5 messages):
 * node examples/send-community-messages-example.js text 54530371 5
 *
 * Send only stickers to community 12345678 (max 3 messages):
 * node examples/send-community-messages-example.js stickers 12345678 3
 *
 * Send text messages with stickers to community 87654321 (max 10 messages):
 * node examples/send-community-messages-example.js combined 87654321 10
 */