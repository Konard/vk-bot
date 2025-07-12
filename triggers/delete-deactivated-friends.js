const { getAllFriends } = require('../friends-cache');
const { sleep, priorityFriendIds, second, ms } = require('../utils');

async function deleteDeactivatedFriends({ vk }) {
  const deactivatedValues = ['banned', 'deleted'];
  const deletedFriendsIds = [];

  const allFriends = await getAllFriends({ context: { vk } });

  const deactivatedFriends = allFriends.filter(friend => friend.deactivated && deactivatedValues.includes(friend.deactivated));
  for (const friend of deactivatedFriends) {
    if (priorityFriendIds.includes(friend.id)) {
      console.log(`Skipping deletion of deactivated friend ${friend.id} because it is in priority friends list.`);
      continue;
    }
    try {
      deletedFriendsIds.push(friend.id);
      await vk.api.friends.delete({ user_id: friend.id });
      console.log('Deactivated friend', friend.id, 'was deleted');
    } catch (error) {
      console.error(`Failed to delete deactivated friend: ${error}`);
    }
    await sleep((5 * second) / ms);
  }
}

const trigger = {
  name: "DeleteDeactivatedFriends",
  action: async (context) => {
    return await deleteDeactivatedFriends(context);
  }
};

module.exports = {
  trigger
};