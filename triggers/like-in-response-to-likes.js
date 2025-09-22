const { sleep, second, ms } = require('../utils');

async function likeInResponseToLikes(context) {
  try {
    // Get the like context data
    const likerId = context.likerId;
    const objectId = context.objectId;
    const objectType = context.objectType;
    const objectOwnerId = context.objectOwnerId;
    const postId = context.postId;

    console.log(`Received like from user ${likerId} on ${objectType} ${objectId}`);

    // Don't respond to likes from ourselves (bot's own likes)
    const botInfo = await context.vk.api.users.get();
    if (likerId === botInfo[0].id) {
      console.log('Ignoring like from bot itself');
      return;
    }

    // Add a small delay to avoid rate limiting
    await sleep((2 * second) / ms);

    let likeTarget = {};

    // Determine what to like back based on the object type
    switch (objectType) {
      case 'post':
        // Like the post back
        likeTarget = {
          type: 'post',
          owner_id: objectOwnerId,
          item_id: objectId
        };
        break;

      case 'comment':
        // Like the comment back
        likeTarget = {
          type: 'comment',
          owner_id: objectOwnerId,
          item_id: objectId
        };
        break;

      case 'photo':
        // Like the photo back
        likeTarget = {
          type: 'photo',
          owner_id: objectOwnerId,
          item_id: objectId
        };
        break;

      case 'video':
        // Like the video back
        likeTarget = {
          type: 'video',
          owner_id: objectOwnerId,
          item_id: objectId
        };
        break;

      default:
        console.log(`Unknown object type: ${objectType}, cannot like back`);
        return;
    }

    // Try to like back
    try {
      await context.vk.api.likes.add(likeTarget);
      console.log(`Successfully liked ${objectType} ${objectId} back in response to like from user ${likerId}`);
    } catch (error) {
      // Check if the error is because we already liked this object
      if (error.code === 15) { // Already liked
        console.log(`Already liked ${objectType} ${objectId}, skipping`);
      } else {
        console.error(`Failed to like ${objectType} ${objectId} back:`, error.message);
      }
    }

    // Additional small delay
    await sleep((1 * second) / ms);

  } catch (error) {
    console.error('Error in likeInResponseToLikes:', error);
  }
}

const trigger = {
  name: "LikeInResponseToLikes",
  action: async (context) => {
    return await likeInResponseToLikes(context);
  }
};

module.exports = {
  trigger
};