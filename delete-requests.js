const { sleep } = require('./utils');
const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const deletedFriendsRequestsCount = Number(process.argv[2]) || 0;

async function deleteFriendRequests() {
  try {
    if (deletedFriendsRequestsCount <= 0) {
      return;
    }
    const requests = await vk.api.friends.getRequests({ count: deletedFriendsRequestsCount, out: 1, need_viewed: 1 });
    for (let i = 0; i < requests.items.length; i++) {
      await vk.api.friends.delete({ user_id: requests.items[i] });
      console.log('deleted friend request:', requests.items[i])
      await sleep(3000);
    }
    return requests;
  } catch (error) {
    console.error(error);
  }
}

deleteFriendRequests();