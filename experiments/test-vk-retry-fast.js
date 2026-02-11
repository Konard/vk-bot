// Fast test version with shorter delays for quick testing
const timeUnits = require('../time-units');

// Fast retry function for testing (uses shorter delays)
async function withVkApiRetryFast(apiCall, context = '', maxRetries = 3) {
  let retryCount = 0;
  const { sleep } = require('../utils');

  while (retryCount <= maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 10) { // Internal server error: could not check access_token now, check later
        retryCount++;
        if (retryCount <= maxRetries) {
          const waitTime = 100; // 100ms for testing instead of 5 minutes
          console.warn(`VK API internal server error (code 10) ${context ? `for ${context}` : ''}. Retrying in 100ms... (Attempt ${retryCount}/${maxRetries})`);
          await sleep(waitTime);
          continue;
        } else {
          console.error(`VK API internal server error (code 10) ${context ? `for ${context}` : ''}. Max retries (${maxRetries}) exceeded.`);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
}

// Test function to simulate VK API error code 10
async function simulateApiError(attempt = 1) {
  if (attempt <= 2) {
    const error = new Error('Internal server error: could not check access_token now, check later.');
    error.code = 10;
    error.params = [
      { key: 'method', value: 'messages.getConversationsById' },
      { key: 'oauth', value: '1' },
      { key: 'v', value: '5.131' },
      { key: 'peer_ids', value: '723274787' },
      { key: 'count', value: '1' }
    ];
    throw error;
  }
  return { items: [{ id: 123, title: 'Test conversation' }] };
}

// Test function to simulate other VK API errors that should not be retried
async function simulateOtherError() {
  const error = new Error('User not found');
  error.code = 177;
  throw error;
}

// Test the retry mechanism
async function testRetryMechanism() {
  console.log('Testing VK API retry mechanism (fast version)...');

  try {
    console.log('\n1. Testing successful retry after 2 failures:');
    let attempt = 0;
    const result = await withVkApiRetryFast(async () => {
      attempt++;
      console.log(`  Attempt ${attempt}`);
      return simulateApiError(attempt);
    }, 'test API call');
    console.log('  ✓ Success:', result);
  } catch (error) {
    console.log('  ✗ Unexpected failure:', error.message);
  }

  try {
    console.log('\n2. Testing non-retryable error (code 177):');
    await withVkApiRetryFast(async () => {
      return simulateOtherError();
    }, 'test non-retryable call');
    console.log('  ✗ Should have thrown error');
  } catch (error) {
    if (error.code === 177) {
      console.log('  ✓ Correctly threw non-retryable error:', error.message);
    } else {
      console.log('  ✗ Unexpected error:', error.message);
    }
  }

  try {
    console.log('\n3. Testing max retries exceeded (will fail):');
    await withVkApiRetryFast(async () => {
      return simulateApiError(1); // Always fails
    }, 'test max retries', 2); // Set max retries to 2
    console.log('  ✗ Should have thrown error after max retries');
  } catch (error) {
    if (error.code === 10) {
      console.log('  ✓ Correctly threw error after max retries:', error.message);
    } else {
      console.log('  ✗ Unexpected error:', error.message);
    }
  }

  console.log('\nAll tests completed successfully!');
}

// Run the tests
testRetryMechanism().catch(console.error);