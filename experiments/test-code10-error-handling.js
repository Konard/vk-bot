const { handleOutgoingMessage } = require('../outgoing-messages');

// Mock a VK API instance that simulates Code 10 error
let callCount = 0;
const mockVkWithCode10Error = {
  api: {
    messages: {
      send: ({ attachment }) => {
        callCount++;
        console.log(`Mock API call #${callCount} with attachment: ${attachment}`);

        if (attachment === 'audio-2001064727_125064727') {
          // Simulate the actual Code 10 error from the issue
          const error = new Error('Internal server error');
          error.code = 10;
          error.params = [
            { key: 'method', value: 'messages.send' },
            { key: 'oauth', value: '1' },
            { key: 'v', value: '5.131' },
            { key: 'random_id', value: '-3412275262732312' },
            { key: 'user_id', value: '707520792' },
            { key: 'message', value: 'Test birthday message' },
            { key: 'attachment', value: 'audio-2001064727_125064727' }
          ];
          throw error;
        }
        // Return success for retry without attachment
        console.log(`Mock API call succeeded without attachment`);
        return { peer_id: 707520792, message_id: 12345 };
      }
    }
  }
};

// Test the error handling
async function testCode10ErrorHandling() {
  console.log('Testing Code 10 error handling...');

  // Create a mock context that would trigger the Code 10 error
  const context = {
    vk: mockVkWithCode10Error,
    response: {
      user_id: 707520792,
      message: 'С днём рождения! 💥\n\nTest birthday message...',
      attachment: 'audio-2001064727_125064727'
    }
  };

  // Mock the pendingSendQueue
  const { queue } = require('../outgoing-messages');
  queue.length = 0; // Clear any existing items
  queue.push(context);

  try {
    await handleOutgoingMessage();
    console.log('✅ Code 10 error was handled successfully');

    // Verify that the retry was attempted
    if (callCount === 2) {
      console.log('✅ Two API calls were made as expected');
    } else {
      console.log(`❌ Expected 2 calls, but got ${callCount}`);
    }

    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

module.exports = { testCode10ErrorHandling };

if (require.main === module) {
  testCode10ErrorHandling();
}