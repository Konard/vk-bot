const { rateLimitHandler } = require('./rate-limit-handler');

async function testRateLimitHandler() {
  console.log('Testing rate limit handler...');

  // Mock VK API call that succeeds
  const mockSuccessfulCall = async (options) => {
    console.log('Successful API call with options:', options);
    return { success: true, data: options };
  };

  // Mock VK API call that fails with rate limit
  const mockRateLimitCall = async (options) => {
    const error = new Error('Rate limit reached');
    error.code = 29;
    throw error;
  };

  // Mock VK API call that fails with other error
  const mockOtherErrorCall = async (options) => {
    const error = new Error('User not found');
    error.code = 177;
    throw error;
  };

  try {
    // Test successful call
    console.log('\n1. Testing successful API call...');
    const result1 = await rateLimitHandler.executeWithRateLimit(
      mockSuccessfulCall,
      { user_id: 123 },
      'test successful call'
    );
    console.log('Result:', result1);

    // Test rate limit error
    console.log('\n2. Testing rate limit error...');
    const result2 = await rateLimitHandler.executeWithRateLimit(
      mockRateLimitCall,
      { user_id: 456 },
      'test rate limit call'
    );
    console.log('Result after rate limit:', result2);

    // Test other error (should be re-thrown)
    console.log('\n3. Testing other error (should be thrown)...');
    try {
      const result3 = await rateLimitHandler.executeWithRateLimit(
        mockOtherErrorCall,
        { user_id: 789 },
        'test other error call'
      );
      console.log('Result:', result3);
    } catch (error) {
      console.log('Caught expected error:', error.message, 'Code:', error.code);
    }

    // Test rate limit status
    console.log('\n4. Testing rate limit status...');
    console.log('Is currently rate limited:', rateLimitHandler.isCurrentlyRateLimited());
    console.log('Remaining limit time:', rateLimitHandler.getRemainingLimitTime(), 'seconds');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testRateLimitHandler().catch(console.error);