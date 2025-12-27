const { VK } = require('vk-io');
const { getToken } = require('../utils');

// This is an experiment to test what like events are available
const token = getToken();
const vk = new VK({ token });

// Let's try to listen to different like events
const likeEvents = ['like_add', 'like_remove', 'like', 'wall_reply_like'];

console.log('Testing like events...');

for (const eventType of likeEvents) {
  try {
    vk.updates.on(eventType, (context) => {
      console.log(`Received ${eventType} event:`, {
        type: context.type,
        subTypes: context.subTypes,
        likerId: context.likerId,
        objectId: context.objectId,
        objectType: context.objectType,
        objectOwnerId: context.objectOwnerId,
        postId: context.postId
      });
    });
    console.log(`Successfully registered handler for ${eventType}`);
  } catch (error) {
    console.log(`Failed to register handler for ${eventType}:`, error.message);
  }
}

// Don't start updates in this experiment - we just want to test registration
console.log('Event handlers registered. This is just a test.');