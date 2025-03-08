const fs = require('fs');
const path = require('path');
const { VK } = require('vk-io');
const { getToken } = require('./utils');

const token = getToken();
const vk = new VK({ token });

async function loadMessages(friendId) {
  try {
    const messages = [];
    let offset = 0;
    const count = 200; // VK API allows a maximum of 200 messages per request

    while (true) {
      const response = await vk.api.messages.getHistory({
        peer_id: friendId,
        offset,
        count
      });

      if (response.items.length === 0) {
        break;
      }

      messages.push(...response.items);
      offset += count;
    }

    const filePath = path.join(__dirname, 'data', 'friends', 'messages', `${friendId}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf-8');

    console.log(`Message history for friend ${friendId} saved to ${filePath}`);
  } catch (error) {
    console.error(`Failed to load messages for friend ${friendId}:`, error);
  }
}

const friendId = process.argv[2];
if (!friendId) {
  console.error('Please provide the friend ID as an argument.');
  process.exit(1);
}

loadMessages(friendId);