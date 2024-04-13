const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { trigger: greetingTrigger } = require('./triggers/greeting');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('./outgoing-messages');
const { sleep } = require('./utils');
const { DateTime } = require('luxon');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
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