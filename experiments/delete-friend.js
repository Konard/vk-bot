const { VK } = require('vk-io');
const { readTextSync } = require('../utils');
const token = readTextSync('token').trim();
const vk = new VK({ token });

(async () => {
  const friendId = 569671699;
  const response = await vk.api.friends.delete({ user_id: friendId });
  console.log(JSON.stringify(response, null, 2));
})();
