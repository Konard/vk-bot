const { VK } = require('vk-io');
const { getToken } = require('../utils');
const { trigger: greetCommunityMembersTrigger } = require('../triggers/greet-community-members');

const token = getToken();
const vk = new VK({ token });

async function testGreetCommunityMembers() {
  console.log('Testing community members greeting...');

  try {
    // Test with a small limit to avoid spamming
    await greetCommunityMembersTrigger.action({
      vk,
      options: { maxGreetings: 3 } // Just test with 3 greetings
    });

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testGreetCommunityMembers();
}