const { VK } = require('vk-io');

// For experiment purposes - normally we would use getToken()
const token = process.env.VK_TOKEN || 'dummy_token_for_testing';

async function testAcceptFriendRequestsTimeout() {
  console.log('Testing AcceptFriendRequests timeout behavior...');

  // Test with default timeout (10 seconds)
  console.log('\n=== Test 1: Default VK timeout (10s) ===');
  const vkDefault = new VK({ token });

  try {
    const startTime = Date.now();

    // Simulate the exact sequence from accept-friend-requests.js
    console.log('Step 1: Getting friend requests...');
    const requests = await vkDefault.api.friends.getRequests({ count: 23, sort: 1 });
    console.log(`Found ${requests?.items?.length || 0} friend requests`);

    if (requests?.items?.length > 0) {
      console.log('Step 2: Trying to accept first friend request...');
      const friendId = requests.items[0];
      await vkDefault.api.friends.add({ user_id: friendId, text: '' });
      console.log(`Successfully accepted friend request from ${friendId}`);
    }

    const endTime = Date.now();
    console.log(`✓ Default VK instance completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.log(`✗ Default VK instance failed:`, error.message);
    console.log(`Error type: ${error.name}, Error code: ${error.code}`);
    if (error.name === 'AbortError') {
      console.log('💡 This is the AbortError from the issue!');
    }
  }

  // Test with extended timeout (60 seconds)
  console.log('\n=== Test 2: Extended VK timeout (60s) ===');
  const vkExtended = new VK({
    token,
    apiTimeout: 60000, // 60 seconds timeout
    apiRetryLimit: 3,
    apiWait: 3000 // 3 seconds between requests
  });

  try {
    const startTime = Date.now();

    console.log('Step 1: Getting friend requests...');
    const requests = await vkExtended.api.friends.getRequests({ count: 23, sort: 1 });
    console.log(`Found ${requests?.items?.length || 0} friend requests`);

    if (requests?.items?.length > 0) {
      console.log('Step 2: Trying to accept first friend request...');
      const friendId = requests.items[0];
      await vkExtended.api.friends.add({ user_id: friendId, text: '' });
      console.log(`Successfully accepted friend request from ${friendId}`);
    }

    const endTime = Date.now();
    console.log(`✓ Extended timeout VK instance completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.log(`✗ Extended timeout VK instance failed:`, error.message);
    console.log(`Error type: ${error.name}, Error code: ${error.code}`);
    if (error.name === 'AbortError') {
      console.log('⚠️  Still getting AbortError even with extended timeout');
    }
  }

  // Test with even longer timeout and custom HTTPS agent
  console.log('\n=== Test 3: Maximum timeout with custom agent ===');
  const https = require('https');
  const agent = new https.Agent({
    timeout: 120000, // 2 minutes
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxSockets: 10
  });

  const vkMaxTimeout = new VK({
    token,
    agent,
    apiTimeout: 120000, // 2 minutes
    apiRetryLimit: 5,
    apiWait: 5000 // 5 seconds between requests
  });

  try {
    const startTime = Date.now();

    console.log('Step 1: Getting friend requests...');
    const requests = await vkMaxTimeout.api.friends.getRequests({ count: 23, sort: 1 });
    console.log(`Found ${requests?.items?.length || 0} friend requests`);

    if (requests?.items?.length > 0) {
      console.log('Step 2: Trying to accept first friend request...');
      const friendId = requests.items[0];
      await vkMaxTimeout.api.friends.add({ user_id: friendId, text: '' });
      console.log(`Successfully accepted friend request from ${friendId}`);
    }

    const endTime = Date.now();
    console.log(`✓ Maximum timeout VK instance completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.log(`✗ Maximum timeout VK instance failed:`, error.message);
    console.log(`Error type: ${error.name}, Error code: ${error.code}`);
    if (error.name === 'AbortError') {
      console.log('🚨 AbortError persists even with maximum timeout - might be VK API issue');
    }
  }

  console.log('\n=== Timeout behavior test completed ===');
  console.log('Recommendations:');
  console.log('1. Use apiTimeout: 60000 (60 seconds) or higher');
  console.log('2. Consider adding retry logic for AbortError specifically');
  console.log('3. Add proper error handling for network timeouts');
}

// Only run if this file is executed directly
if (require.main === module) {
  testAcceptFriendRequestsTimeout().catch(console.error);
} else {
  module.exports = { testAcceptFriendRequestsTimeout };
}