const { sleep } = require('../utils');

async function acceptFriendRequests({ vk }) {
  try {
    const maxFriendRequestsCount = 23;
    const requests = await vk.api.friends.getRequests({ count: maxFriendRequestsCount });
    for (let i = 0; i < requests.items.length; i++) {
      await vk.api.friends.add({ user_id: requests.items[i], text: '' });
      await sleep(3000);
    }
    if (requests?.items?.length <= 0) {
      console.log('No incoming friend requests to be accepted');
    } else {
      console.log('Incoming friend requests accepted:', JSON.stringify(requests, null, 2));
    }
  } catch (error) {
    if (error.code === 242) { // APIError: Code №242 - Too many friends: friends count exceeded
      console.log('Could not accept friend requests, because friends count exceeded.');
    } else {
      console.error('Could not accept friend requests:', error);
    }
  }
}

const trigger = {
  name: "AcceptFriendRequests",
  action: async (context) => {
    return await acceptFriendRequests(context);
  }
};

module.exports = {
  trigger
};