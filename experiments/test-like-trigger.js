const { getToken } = require('../utils');
const { VK } = require('vk-io');
const { likeFriendsAvatars } = require('../triggers/like-friends-avatars');

// Test the like friends avatars trigger
async function testLikeTrigger() {
  const token = getToken();
  const vk = new VK({ token });

  console.log('Testing the like friends avatars trigger...');

  try {
    // Run the trigger with limited options for testing
    await likeFriendsAvatars({
      vk,
      options: {
        maxLikes: 3, // Limit to 3 for testing
        minDelaySeconds: 5 // Shorter delay for testing
      }
    });

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  testLikeTrigger();
}