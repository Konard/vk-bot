const { sleep, priorityFriendIds, second, minute } = require('../utils');

const sortByMutuals = { sort: 1 };

async function acceptFriendRequests({ vk }) {
  try {

    // TODO: Move to separate trigger
    for (const friendId of priorityFriendIds) {
      try {
        await vk.api.friends.add({ user_id: friendId, text: '' });
        console.log(`Friend request is sent to priority friend with id ${friendId}.`);
      } catch (error) {
        if (error.code === 177) { // APIError: Code №177 - Cannot add this user to friends as user not found
          console.log(`Could not send friend request to priority friend with id ${friendId}, because this friend is not found.`);
        } else if (error.code === 242) { // APIError: Code №242 - Too many friends: friends count exceeded
          console.log(`Could not send friend request to priority friend with id ${friendId}, because friends count (10000) exceeded.`);
          return;
        } else if (error.code === 29) { // APIError: Code №29 - Rate limit reached
          console.log(`Could not send friend request to priority friend with id ${friendId}, because rate limit reached.`);
          await sleep(1 * minute);
          return;
        } else {
          console.error(`Could not send priority friend request to ${friendId}:`, error);
          return;
        }
      }
      await sleep(10 * second);
    }

    const maxFriendRequestsCount = 23;
    const requests = await vk.api.friends.getRequests({ count: maxFriendRequestsCount, ...sortByMutuals });
    if (requests?.items?.length <= 0) {
      console.log('No incoming friend requests to be accepted.');
      return;
    }
    await sleep(2 * second);
    for (let i = 0; i < requests.items.length; i++) {
      const friendId = requests.items[i];
      try {
        await vk.api.friends.add({ user_id: friendId, text: '' });
        console.log(`Incoming request for friend ${friendId} is accepted.`);
      } catch(error) {
        if (error.code === 177) { // APIError: Code №177 - Cannot add this user to friends as user not found
          console.log(`Could not accept ${friendId} friend request, because this friend is not found.`);
        } else if (error.code === 242) { // APIError: Code №242 - Too many friends: friends count exceeded
          console.log(`Could not accept ${friendId} friend request, because friends count (10000) exceeded.`);
          return;
        } else {
          console.error(`Could not accept ${friendId} friend request:`, error);
          return;
        }
      }
      await sleep(3 * second);
    }
  } catch (error) {
    console.error('Could not accept friend requests:', error);
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