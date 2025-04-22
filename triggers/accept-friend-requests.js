const { getAllFriends, loadAllFriends } = require('../friends-cache');
const { sleep, priorityFriendIds, second, minute } = require('../utils');

const sortByMutuals = { sort: 1 };
const maxFriends = 10000;

async function acceptFriendRequests({ vk }) {
  try {
    let allFriends = getAllFriends({ context: { vk } });

    const existingFriends = allFriends.length;
    let addedFriends = 0;

    // TODO: Move to separate trigger
    for (const friendId of priorityFriendIds) {
      if ((existingFriends + addedFriends) >= maxFriends) {
        console.log(`Maximum friends count (${maxFriends}) exceeded. Cannot add more friends.`);
        break;
      }
      if (allFriends.some(friend => friend.id === friendId)) {
        console.log(`Friend with id ${friendId} is already in friends.`);
        continue;
      }
      try {
        await vk.api.friends.add({ user_id: friendId, text: '' });
        addedFriends++;
        console.log(`Friend request is sent to priority friend with id ${friendId}.`);
      } catch (error) {
        if (error.code === 177) { // APIError: Code №177 - Cannot add this user to friends as user not found
          console.log(`Could not send friend request to priority friend with id ${friendId}, because this friend is not found.`);
        } else if (error.code === 242) { // APIError: Code №242 - Too many friends: friends count exceeded
          console.log(`Could not send friend request to priority friend with id ${friendId}, because friends count (10000) exceeded.`);
          break;
        } else if (error.code === 29) { // APIError: Code №29 - Rate limit reached
          console.log(`Could not send friend request to priority friend with id ${friendId}, because rate limit reached.`);
          await sleep(1 * minute);
          break;
        } else {
          console.error(`Could not send priority friend request to ${friendId}:`, error);
          break;
        }
      }
      await sleep(10 * second);
    }

    const maxFriendRequestsCount = 23;
    const requests = await vk.api.friends.getRequests({ count: maxFriendRequestsCount, ...sortByMutuals });
    await sleep(2 * second);
    if (requests?.items?.length <= 0) {
      console.log('No incoming friend requests to be accepted.');
      if (addedFriends > 0) {
        await loadAllFriends({ context: { vk } }); // needed to reload friends cache
      }
      return;
    }
    for (let i = 0; i < requests.items.length; i++) {
      const friendId = requests.items[i];
      if ((existingFriends + addedFriends) >= maxFriends) {
        console.log(`Maximum friends count (${maxFriends}) exceeded. Cannot add more friends.`);
        break;
      }
      if (allFriends.some(friend => friend.id === friendId)) {
        console.log(`Friend with id ${friendId} is already in friends.`);
        continue;
      }
      try {
        await vk.api.friends.add({ user_id: friendId, text: '' });
        addedFriends++;
        console.log(`Incoming request for friend ${friendId} is accepted.`);
      } catch(error) {
        if (error.code === 177) { // APIError: Code №177 - Cannot add this user to friends as user not found
          console.log(`Could not accept ${friendId} friend request, because this friend is not found.`);
        } else if (error.code === 242) { // APIError: Code №242 - Too many friends: friends count exceeded
          console.log(`Could not accept ${friendId} friend request, because friends count (10000) exceeded.`);
          break;
        } else {
          console.error(`Could not accept ${friendId} friend request:`, error);
          break;
        }
      }
      await sleep(10 * second);
    }
  } catch (error) {
    console.error('Could not accept friend requests:', error);
  }

  if (addedFriends > 0) {
    await loadAllFriends({ context: { vk } }); // needed to reload friends cache
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