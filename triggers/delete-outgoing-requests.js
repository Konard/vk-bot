const { sleep, priorityFriendIds, second, ms } = require('../utils');

async function deleteOutgoingFriendRequests(context) {
  try {
    const count = context?.options?.maxRequests;
    if (count <= 0) {
      return;
    }
    let requests;
    try {
      requests = await context.vk.api.friends.getRequests({ count, out: 1, need_viewed: 1 });
    } catch (error) {
      if (error.code === 5) { // APIError: Code №5 - User authorization failed: user is blocked
        console.error('Could not get outgoing friend requests: User authorization failed. The account may be blocked or the access token is invalid.');
        return;
      }
      throw error; // Re-throw other errors to be caught by outer try-catch
    }
    if (requests.items.length <= 0) {
      console.log('No outgoing friend requests to be deleted');
      return requests;
    }
    for (let i = 0; i < requests.items.length; i++) {
      try {
        const friendId = requests.items[i];
        if (priorityFriendIds.includes(friendId)) {
          continue;
        }
        await context.vk.api.friends.delete({ user_id: friendId });
        console.log('Deleted outgoing friend request:', friendId)
      } catch (error) {
        console.error(`Failed to delete outgoing friend request: ${error}`);
      }
      await sleep((3 * second) / ms);
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