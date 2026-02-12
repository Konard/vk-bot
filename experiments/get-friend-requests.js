const { VK } = require('vk-io');
const { getToken, withRetry } = require('../utils');
const token = getToken();
const vk = new VK({ token });

(async () => {
  const maxFriendRequestsCount = 23;
  const requests = await withRetry(() =>
    vk.api.friends.getRequests({ count: maxFriendRequestsCount, sort: 1 })
  ); // , extended: true
  console.log(JSON.stringify(requests, null, 2));
})();
