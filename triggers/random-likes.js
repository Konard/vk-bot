const { sleep, getRandomElement, second, minute, ms } = require('../utils');
const { getAllFriends } = require('../friends-cache');

async function getMyUserProfile(context) {
  try {
    const profile = await context.vk.api.users.get({
      fields: ['photo_id']
    });
    return profile[0];
  } catch (error) {
    console.error(trigger.name, 'Error getting user profile:', error);
    return null;
  }
}

async function getMyPinnedPost(context) {
  try {
    // Get wall posts to find pinned post
    const wall = await context.vk.api.wall.get({
      count: 10,
      filter: 'owner'
    });

    // Find pinned post (is_pinned: 1)
    const pinnedPost = wall.items.find(post => post.is_pinned === 1);
    return pinnedPost;
  } catch (error) {
    console.error(trigger.name, 'Error getting pinned post:', error);
    return null;
  }
}

async function getLikesOnObject(context, type, ownerId, itemId) {
  try {
    if (!itemId) {
      console.log(trigger.name, `No ${type} ID provided, skipping likes check`);
      return [];
    }

    const likes = await context.vk.api.likes.getList({
      type,
      owner_id: ownerId,
      item_id: itemId,
      count: 1000 // Get up to 1000 likes
    });

    console.log(trigger.name, `Found ${likes.count} likes on ${type} ${itemId}`);
    return likes.items || [];
  } catch (error) {
    console.error(trigger.name, `Error getting likes on ${type} ${itemId}:`, error);
    return [];
  }
}

async function getOnlineFriends(context) {
  try {
    const onlineFriends = await context.vk.api.friends.getOnline({
      online_mobile: 1
    });

    // Combine online and online_mobile arrays
    let allOnlineFriends = [];
    if (onlineFriends.online) {
      allOnlineFriends = allOnlineFriends.concat(onlineFriends.online);
    }
    if (onlineFriends.online_mobile) {
      allOnlineFriends = allOnlineFriends.concat(onlineFriends.online_mobile);
    }

    // Remove duplicates
    allOnlineFriends = [...new Set(allOnlineFriends)];

    console.log(trigger.name, `Found ${allOnlineFriends.length} online friends`);
    return allOnlineFriends;
  } catch (error) {
    console.error(trigger.name, 'Error getting online friends:', error);
    return [];
  }
}

async function addLikeToFriendContent(context, friendId) {
  try {
    // Get friend's recent wall posts
    const wall = await context.vk.api.wall.get({
      owner_id: friendId,
      count: 5,
      filter: 'owner'
    });

    if (!wall.items || wall.items.length === 0) {
      console.log(trigger.name, `No posts found for friend ${friendId}`);
      return false;
    }

    // Try to like the most recent post
    const recentPost = wall.items[0];
    await context.vk.api.likes.add({
      type: 'post',
      owner_id: friendId,
      item_id: recentPost.id
    });

    console.log(trigger.name, `Liked post ${recentPost.id} of friend ${friendId}`);
    await sleep(trigger.name, (2 * second) / ms);

    return true;
  } catch (error) {
    if (error.code === 15) { // Access denied
      console.log(trigger.name, `Access denied to like content of friend ${friendId}`);
    } else if (error.code === 100) { // One of the parameters specified was missing or invalid
      console.log(trigger.name, `Invalid parameters when liking content of friend ${friendId}`);
    } else {
      console.error(trigger.name, `Error liking content of friend ${friendId}:`, error);
    }
    return false;
  }
}

async function randomLikes(context) {
  try {
    console.log(trigger.name, 'Starting random likes based on pay it forward strategy');

    // Get my profile to get avatar photo ID
    const myProfile = await getMyUserProfile(context);
    if (!myProfile) {
      console.error(trigger.name, 'Could not get user profile');
      return;
    }

    const myUserId = myProfile.id;
    console.log(trigger.name, `My user ID: ${myUserId}`);

    // Get my pinned post
    const pinnedPost = await getMyPinnedPost(context);

    // Get likes on avatar and pinned post
    let allLikerIds = [];

    // Get likes on avatar (photo)
    if (myProfile.photo_id) {
      // Extract photo ID from photo_id string (format: "ownerId_photoId")
      const photoIdParts = myProfile.photo_id.split('_');
      if (photoIdParts.length >= 2) {
        const photoId = photoIdParts[1];
        const avatarLikes = await getLikesOnObject(context, 'photo', myUserId, photoId);
        allLikerIds = allLikerIds.concat(avatarLikes);
      }
    }

    // Get likes on pinned post
    if (pinnedPost) {
      const pinnedPostLikes = await getLikesOnObject(context, 'post', myUserId, pinnedPost.id);
      allLikerIds = allLikerIds.concat(pinnedPostLikes);
    }

    // Remove duplicates
    allLikerIds = [...new Set(allLikerIds)];
    console.log(trigger.name, `Total unique likers: ${allLikerIds.length}`);

    // Get online friends
    const onlineFriends = await getOnlineFriends(context);

    if (onlineFriends.length === 0) {
      console.log(trigger.name, 'No online friends found');
      return;
    }

    // Filter friends who haven't liked my content
    const friendsWhoHaventLiked = onlineFriends.filter(friendId => !allLikerIds.includes(friendId));

    console.log(trigger.name, `Friends who haven't liked my content: ${friendsWhoHaventLiked.length}`);

    if (friendsWhoHaventLiked.length === 0) {
      console.log(trigger.name, 'All online friends have already liked my content or considering all friends');
      // As mentioned in the issue: "may be it is even a good idea not to filter the friends"
      // So we'll use all online friends if no one is left to like
      const randomFriend = getRandomElement(onlineFriends);
      if (randomFriend) {
        console.log(trigger.name, `Giving like to random online friend ${randomFriend} (no filter applied)`);
        await addLikeToFriendContent(context, randomFriend);
      }
      return;
    }

    // Select random friend who hasn't liked my content
    const randomFriend = getRandomElement(friendsWhoHaventLiked);

    if (randomFriend) {
      console.log(trigger.name, `Giving like to random friend ${randomFriend} who hasn't liked my content`);
      await addLikeToFriendContent(context, randomFriend);
    }

  } catch (error) {
    console.error(trigger.name, 'Error in random likes:', error);
  }
}

const trigger = {
  name: "RandomLikes",
  action: async (context) => {
    return await randomLikes(context);
  }
};

module.exports = {
  trigger
};