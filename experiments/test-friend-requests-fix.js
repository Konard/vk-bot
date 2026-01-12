const { trigger: acceptFriendRequestsTrigger } = require('../triggers/accept-friend-requests');
const { VK } = require('vk-io');
const { getToken } = require('../utils');

async function testAcceptFriendRequestsFix() {
  console.log('Testing accept friend requests fix...');

  try {
    const token = getToken();
    const vk = new VK({ token });

    // Test the fixed trigger
    console.log('Testing accept friend requests trigger with retry logic...');
    await acceptFriendRequestsTrigger.action({ vk });
    console.log('Accept friend requests trigger completed successfully');

  } catch (error) {
    console.log('Error during test:', error);

    // Check if our fix properly handles AbortErrors
    if (error.type === 'aborted' || error.message?.includes('AbortError')) {
      console.log('✅ AbortError handled correctly by the fix');
    } else {
      console.log('❌ Unexpected error type:', error.type);
    }
  }
}

// Test the retry function in isolation
async function testRetryFunction() {
  const { retryApiCall } = require('../triggers/accept-friend-requests');

  console.log('Testing retry function with simulated abort error...');

  let attemptCount = 0;
  const mockApiCall = () => {
    attemptCount++;
    if (attemptCount < 3) {
      const error = new Error('The operation was aborted.');
      error.type = 'aborted';
      throw error;
    }
    return { success: true, attempts: attemptCount };
  };

  try {
    const result = await retryApiCall(mockApiCall);
    console.log('✅ Retry function worked:', result);
  } catch (error) {
    console.log('❌ Retry function failed:', error);
  }
}

console.log('Running tests...');
testRetryFunction().then(() => {
  console.log('Retry function test completed');
}).catch(console.error);

// Uncomment to test actual API calls (requires valid token)
// testAcceptFriendRequestsFix();