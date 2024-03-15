const { sleep } = require('../utils');

async function deleteDeactivatedFriends({ vk }) {
  const step = 5000;
  const deactivatedValues = ['banned', 'deleted'];
  const deletedFriendsIds = [];
  let offset = 0;
  while (true) {
    try {
      const friends = await vk.api.friends.get({ count: step, offset, fields: ['deactivated'] });
      const deactivatedFriends = friends.items.filter(friend => friend.deactivated && deactivatedValues.includes(friend.deactivated));
      for (const friend of deactivatedFriends) {
        try {
          deletedFriendsIds.push(friend.id);
          await vk.api.friends.delete({ user_id: friend.id });
          console.log('Deactivated friend', friend.id, 'was deleted');
        } catch (error) {
          console.error(`Failed to delete deactivated friend: ${error}`);
        }
        await sleep(3000);
      }
      if (offset + step >= 10000 || friends.items.length < step) {
        if (deletedFriendsIds?.length <= 0) {
          console.log('No deactivated friends to be deleted');
        } else {
          console.log(`Deleted deactivated friends: ${deletedFriendsIds}`);
        }
        break;
      }
      offset += step;
    } catch (error) {
      console.error(`Could not get or delete deactivated friends: ${error}`);
    }
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