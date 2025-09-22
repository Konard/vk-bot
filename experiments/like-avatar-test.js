const { getToken } = require('../utils');
const { VK } = require('vk-io');

// Test script to understand how to like user profile photos (avatars)
async function testLikingAvatar() {
  const token = getToken();
  const vk = new VK({ token });

  try {
    // Get info about the current user to test with
    const user = await vk.api.users.get({ fields: ['photo_id'] });
    console.log('Current user info:', user);

    // For testing, let's try to get a friend's info first
    const friends = await vk.api.friends.get({ count: 1, fields: ['photo_id'] });
    if (friends.items.length > 0) {
      const friend = friends.items[0];
      console.log('Friend info:', friend);

      // Try to like the friend's profile photo
      // The VK API likes.add method requires:
      // - type: 'photo' for photos
      // - owner_id: user ID who owns the photo
      // - item_id: photo ID

      if (friend.photo_id) {
        console.log(`Attempting to like ${friend.first_name} ${friend.last_name}'s avatar (photo_id: ${friend.photo_id})`);

        try {
          const result = await vk.api.likes.add({
            type: 'photo',
            owner_id: friend.id,
            item_id: friend.photo_id
          });
          console.log('Like result:', result);
        } catch (error) {
          console.error('Error liking photo:', error);
        }
      } else {
        console.log('Friend does not have a profile photo or photo_id is not available');
      }
    } else {
      console.log('No friends found for testing');
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  testLikingAvatar();
}

module.exports = { testLikingAvatar };