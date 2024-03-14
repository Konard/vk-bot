const { sleep } = require('../utils');

async function deleteOutgoingFriendRequests(context) {
  try {
    const count = context?.options?.maxRequests;
    if (count <= 0) {
      return;
    }
    const requests = await context.vk.api.friends.getRequests({ count, out: 1, need_viewed: 1 });
    for (let i = 0; i < requests.items.length; i++) {
      await context.vk.api.friends.delete({ user_id: requests.items[i] });
      console.log('deleted outgoing friend request:', requests.items[i])
      await sleep(3000);
    }
    return requests;
  } catch (error) {
    console.error(error);
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