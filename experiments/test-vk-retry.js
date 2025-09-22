const { withVkApiRetry } = require('../utils');

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
  console.log('Testing VK API retry mechanism...');

  try {
    console.log('\n1. Testing successful retry after 2 failures:');
    let attempt = 0;
    const result = await withVkApiRetry(async () => {
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
    await withVkApiRetry(async () => {
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
    await withVkApiRetry(async () => {
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

  console.log('\nAll tests completed!');
}

// Run the tests
testRetryMechanism().catch(console.error);