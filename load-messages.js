const fs = require('fs');
const path = require('path');
const { VK } = require('vk-io');
const { getToken, sleep, minute } = require('./utils');

const token = getToken();
const vk = new VK({ token });

async function loadMessages(friendId) {
  try {
    const messages = [];
    let offset = 0;
    const count = 200; // VK API allows a maximum of 200 messages per request

    while (true) {
      let response;
      while (true) {
        try {
          response = await vk.api.messages.getHistory({
            peer_id: friendId,
            offset,
            count
          });
          break; // Success, exit retry loop
        } catch (error) {
          if (error.code === 10) { // APIError: Code ? 10 - Internal server error: engine not available, please try again later
            console.warn(`VK API internal server error (code 10) for friend ${friendId}. Retrying in 5 minutes...`);
            await sleep(minute * 5);
            continue;
          } else {
            throw error;
          }
        }
      }

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