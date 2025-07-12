const { VK } = require('vk-io');
const { getToken } = require('../utils');
const token = getToken();
const vk = new VK({ token });

(async () => {
  const friendId = 569671699;
  const response = await vk.api.friends.delete({ user_id: friendId });
  console.log(JSON.stringify(response, null, 2));
})();
