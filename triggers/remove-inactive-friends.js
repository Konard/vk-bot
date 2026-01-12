const { getAllFriends, loadAllFriends } = require('../friends-cache');
const { sleep, priorityFriendIds, second, minute, ms } = require('../utils');

const maxFriends = 10000;

async function removeInactiveFriends({ vk }) {
  try {
    // Get incoming friend requests count
    const requests = await vk.api.friends.getRequests({ count: 1, out: 0 });
    await sleep((2 * second) / ms);

    const incomingRequestsCount = requests?.count || 0;
    if (incomingRequestsCount === 0) {
      console.log('No incoming friend requests. No need to remove inactive friends.');
      return;
    }

    console.log(`Found ${incomingRequestsCount} incoming friend requests.`);

    // Get all current friends
    const allFriends = await getAllFriends({ context: { vk } });
    const currentFriendsCount = allFriends.length;

    console.log(`Current friends count: ${currentFriendsCount}`);

    // Check if we're at or near the limit
    if (currentFriendsCount < maxFriends) {
      console.log(`Friends count (${currentFriendsCount}) is below maximum (${maxFriends}). No need to remove inactive friends.`);
      return;
    }

    // Calculate how many friends we need to remove
    const friendsToRemoveCount = Math.min(incomingRequestsCount, currentFriendsCount - maxFriends + incomingRequestsCount);

    if (friendsToRemoveCount <= 0) {
      console.log('No friends need to be removed.');
      return;
    }

    console.log(`Need to remove ${friendsToRemoveCount} inactive friends to make room for incoming requests.`);

    // Filter out priority friends and deactivated friends
    const removableFriends = allFriends.filter(friend =>
      !priorityFriendIds.includes(friend.id) &&
      !friend.deactivated
    );

    // Sort friends by activity (last_seen timestamp)
    // Friends without last_seen or who are offline for the longest time come first
    const sortedByInactivity = removableFriends.sort((a, b) => {
      // If friend doesn't have last_seen data, consider them most inactive
      if (!a.last_seen && !b.last_seen) return 0;
      if (!a.last_seen) return -1;
      if (!b.last_seen) return 1;

      // If one is online (online === 1), they should be sorted last (more active)
      if (a.online && !b.online) return 1;
      if (!a.online && b.online) return -1;

      // Otherwise sort by last_seen timestamp (earlier timestamp = more inactive)
      const aTime = a.last_seen?.time || 0;
      const bTime = b.last_seen?.time || 0;
      return aTime - bTime;
    });

    // Get the friends to remove (most inactive ones)
    const friendsToRemove = sortedByInactivity.slice(0, friendsToRemoveCount);

    if (friendsToRemove.length === 0) {
      console.log('No removable friends found (all friends are either priority or deactivated).');
      return;
    }

    console.log(`Removing ${friendsToRemove.length} most inactive friends...`);

    let removedCount = 0;
    for (const friend of friendsToRemove) {
      try {
        await vk.api.friends.delete({ user_id: friend.id });
        removedCount++;
        console.log(`Removed inactive friend ${friend.id}. Last seen: ${friend.last_seen?.time ? new Date(friend.last_seen.time * 1000).toISOString() : 'never'}`);
      } catch (error) {
        console.error(`Failed to remove friend ${friend.id}:`, error);
      }
      await sleep((5 * second) / ms);
    }

    console.log(`Successfully removed ${removedCount} inactive friends to make room for ${incomingRequestsCount} incoming friend requests.`);

    // Reload friends cache after removals
    if (removedCount > 0) {
      await loadAllFriends({ context: { vk } });
    }
  } catch (error) {
    console.error('Could not remove inactive friends:', error);
  }
}

const trigger = {
  name: "RemoveInactiveFriends",
  action: async (context) => {
    return await removeInactiveFriends(context);
  }
};

module.exports = {
  trigger
};
