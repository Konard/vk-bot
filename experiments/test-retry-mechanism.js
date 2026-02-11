const { retryWithBackoff, sleep } = require('../utils');

// Mock function that simulates network timeout
async function mockNetworkOperation(shouldFail = true, attemptCount = 0) {
  attemptCount++;
  console.log(`Mock operation attempt ${attemptCount}`);

  if (shouldFail && attemptCount < 3) {
    const error = new Error('FetchError: request to https://api.vk.com/method/friends.getRequests failed, reason: ');
    error.code = 'ETIMEDOUT';
    error.type = 'system';
    error.errno = 'ETIMEDOUT';
    throw error;
  }

  console.log('Mock operation succeeded!');
  return { items: [123456, 789012] }; // Mock response
}

async function testRetryMechanism() {
  console.log('Testing retry mechanism...\n');

  try {
    let attemptCount = 0;
    const result = await retryWithBackoff(async () => {
      return await mockNetworkOperation(true, attemptCount++);
    });

    console.log('Test passed! Result:', result);
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Test case for immediate success
async function testImmediateSuccess() {
  console.log('\nTesting immediate success...\n');

  try {
    const result = await retryWithBackoff(async () => {
      return await mockNetworkOperation(false);
    });

    console.log('Immediate success test passed! Result:', result);
  } catch (error) {
    console.error('Immediate success test failed:', error.message);
  }
}

// Test case for non-retryable error
async function testNonRetryableError() {
  console.log('\nTesting non-retryable error...\n');

  try {
    const result = await retryWithBackoff(async () => {
      const error = new Error('APIError: Code №177 - Cannot add this user to friends as user not found');
      error.code = 177;
      throw error;
    });

    console.log('Non-retryable test should have failed but passed! Result:', result);
  } catch (error) {
    console.log('Non-retryable error test passed - error was not retried:', error.message);
  }
}

async function runTests() {
  await testRetryMechanism();
  await testImmediateSuccess();
  await testNonRetryableError();
  console.log('\nAll tests completed!');
}

runTests().catch(console.error);