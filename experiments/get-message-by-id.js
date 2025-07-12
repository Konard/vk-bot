const { VK } = require('vk-io');
const { getToken } = require('../utils');
const { DateTime } = require('luxon');
const token = getToken();
const vk = new VK({ token });

(async () => {
  const messageId = 30091827;
  const response = await vk.api.messages.getById({ message_ids: messageId });
  const messageData = response.items[0]; // Assuming the message ID is valid

  const now = DateTime.now();
  const messageDate = DateTime.fromSeconds(messageData.date);
  const diff = now.diff(messageDate, 'days').days;
  console.log({diff});

  console.log(JSON.stringify(messageData, null, 2));
})();