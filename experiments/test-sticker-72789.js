const fs = require('fs');
const { VK } = require('vk-io');

// Read token from environment or file
let token;
try {
  token = process.env.VK_TOKEN || fs.readFileSync('.env', 'utf8').split('=')[1].trim();
} catch (e) {
  console.error('Cannot find VK token. Please set VK_TOKEN environment variable or create .env file');
  process.exit(1);
}

const vk = new VK({ token });

async function testSticker() {
  console.log('Testing sticker 72789...');

  try {
    // Try to get user info first to ensure the API connection works
    const user = await vk.api.users.get();
    console.log('VK API connection working, user ID:', user[0].id);

    // Try to send sticker 72789 to ourselves
    const response = await vk.api.messages.send({
      user_id: user[0].id,
      sticker_id: 72789,
      random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    });

    console.log('Sticker 72789 sent successfully:', response);
  } catch (error) {
    console.error('Error sending sticker 72789:', error);
    console.error('Error code:', error.code);
    console.error('Error params:', error.params);

    if (error.code === 10) {
      console.log('Sticker 72789 appears to be unavailable (Internal server error)');
    }
  }
}

testSticker().catch(console.error);