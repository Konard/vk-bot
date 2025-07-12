const { VK } = require('vk-io');
const { getToken } = require('../utils');
const token = getToken();
const vk = new VK({ token });

(async () => {
  const friendId = 569671699;
  const response = await vk.api.users.get({
    user_ids: [friendId],
    fields: ['deactivated'] // Request the 'deactivated' field
  });
  console.log('banned:', response[0].deactivated === 'banned');
  console.log(JSON.stringify(response, null, 2));
})();
