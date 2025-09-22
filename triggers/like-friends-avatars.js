const { getAllFriends } = require('../friends-cache');
const { sleep, second, minute, ms } = require('../utils');

async function likeFriendsAvatars({ vk, options = {} }) {
  const { maxLikes = 50, minDelaySeconds = 30 } = options;

  try {
    console.log('Starting to like friends avatars...');

    // Get all friends with photo_id field
    const allFriends = await getAllFriends({
      context: { vk },
      fields: ['photo_id', 'online', 'last_seen', 'deactivated']
    });

    if (!allFriends || allFriends.length === 0) {
      console.log('No friends found to like avatars.');
      return;
    }

    console.log(`Found ${allFriends.length} friends. Processing avatars...`);

    let likesCount = 0;

    // Filter friends who have profile photos and are not deactivated
    const friendsWithAvatars = allFriends.filter(friend =>
      friend.photo_id &&
      !friend.deactivated &&
      friend.id // Ensure friend has valid ID
    );

    console.log(`${friendsWithAvatars.length} friends have avatars to like.`);

    // Shuffle the friends array to avoid predictable patterns
    const shuffledFriends = friendsWithAvatars.sort(() => 0.5 - Math.random());

    for (const friend of shuffledFriends) {
      if (likesCount >= maxLikes) {
        console.log(`Reached maximum likes limit (${maxLikes}). Stopping.`);
        break;
      }

      try {
        console.log(`Attempting to like ${friend.first_name || 'Unknown'} ${friend.last_name || 'Friend'}'s avatar (ID: ${friend.id}, Photo ID: ${friend.photo_id})`);

        const result = await vk.api.likes.add({
          type: 'photo',
          owner_id: friend.id,
          item_id: friend.photo_id
        });

        if (result.likes) {
          likesCount++;
          console.log(`✓ Liked ${friend.first_name || 'Unknown'}'s avatar. Total likes: ${result.likes}`);
        } else {
          console.log(`✓ Processed ${friend.first_name || 'Unknown'}'s avatar.`);
        }

        // Wait between likes to avoid rate limiting
        const delayMs = (minDelaySeconds * second) / ms;
        await sleep(delayMs);

      } catch (error) {
        if (error.code === 15) {
          console.log(`Cannot like ${friend.first_name || 'Unknown'}'s avatar - access denied or privacy settings.`);
        } else if (error.code === 7) {
          console.log(`Cannot like ${friend.first_name || 'Unknown'}'s avatar - already liked or photo doesn't exist.`);
        } else if (error.code === 29) {
          console.log('Rate limit reached. Waiting longer before next attempt...');
          await sleep((2 * minute) / ms);
        } else {
          console.error(`Error liking ${friend.first_name || 'Unknown'}'s avatar:`, error);
        }

        // Wait a bit even after errors
        await sleep((10 * second) / ms);
      }
    }

    console.log(`Finished liking friends avatars. Total likes given: ${likesCount}`);

  } catch (error) {
    console.error('Error in likeFriendsAvatars:', error);
  }
}

const trigger = {
  name: "LikeFriendsAvatars",
  action: async (context) => {
    return await likeFriendsAvatars(context);
  }
};

module.exports = {
  trigger,
  likeFriendsAvatars
};