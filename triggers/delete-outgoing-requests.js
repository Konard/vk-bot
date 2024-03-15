const { sleep } = require('../utils');

async function deleteOutgoingFriendRequests(context) {
  try {
    const count = context?.options?.maxRequests;
    if (count <= 0) {
      return;
    }
    const requests = await context.vk.api.friends.getRequests({ count, out: 1, need_viewed: 1 });
    if (requests.items.length <= 0) {
      console.log('No outgoing friend requests to be deleted');
      return requests;
    }
    for (let i = 0; i < requests.items.length; i++) {
      try {
        const friendId = requests.items[i];
        await context.vk.api.friends.delete({ user_id: friendId });
        console.log('Deleted outgoing friend request:', friendId)
      } catch (error) {
        console.error(`Failed to delete outgoing friend request: ${error}`);
      }
      await sleep(3000);
    }
    return requests;
  } catch (error) {
    console.error(`Could not get or delete outgoing friend requests: ${error}`);
  }
}

const trigger = {
  name: "DeleteOutgoingFriendRequests",
  action: async (context) => {
    return await deleteOutgoingFriendRequests(context);
  }
};

module.exports = {
  trigger
};