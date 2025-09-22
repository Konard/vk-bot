// Test script to verify VK API error handling
const { loadConversation } = require('../friends-conversations-cache');

// Mock context that will simulate VK API error 10
const mockContext = {
  vk: {
    api: {
      messages: {
        getConversationsById: async (options) => {
          // Simulate VK API error code 10
          const error = new Error('Internal server error: Unknown error, try later');
          error.code = 10;
          throw error;
        }
      }
    }
  }
};

async function testErrorHandling() {
  console.log('Testing VK API error 10 handling...');

  try {
    const result = await loadConversation({
      context: mockContext,
      friendId: 123456789,
      updateCache: false
    });

    if (result === null) {
      console.log('✅ Error handling works correctly - returned null after max retries');
    } else {
      console.log('❌ Error handling failed - should have returned null');
    }
  } catch (error) {
    console.log('❌ Error was not caught properly:', error.message);
  }
}

testErrorHandling();