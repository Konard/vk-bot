const { sleep } = require('./utils');
const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

async function deleteFriendRequests() {
  try {
      const requests = await vk.api.friends.getRequests({ count: 23, out: 1 });
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