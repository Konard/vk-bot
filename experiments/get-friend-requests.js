const { VK } = require('vk-io');
const { readTextSync } = require('../utils');
const token = readTextSync('token').trim();
const vk = new VK({ token });

(async () => {
  const maxFriendRequestsCount = 23;
  const requests = await vk.api.friends.getRequests({ count: maxFriendRequestsCount, sort: 1 }); // , extended: true
  console.log(JSON.stringify(requests, null, 2));
})();
