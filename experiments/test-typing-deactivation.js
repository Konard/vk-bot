// Test script to verify typing deactivation functionality
const { handleOutgoingMessage, enqueueMessage } = require('../outgoing-messages');

// Mock VK API
const mockVkApi = {
  api: {
    messages: {
      setActivity: jest.fn(),
      send: jest.fn().mockResolvedValue({ message_id: 123 })
    }
  }
};

// Mock request object
const mockRequest = {
  peerId: 12345,
  send: jest.fn().mockResolvedValue({ message_id: 123 })
};

// Test case: Verify typing is deactivated after message send
async function testTypingDeactivation() {
  console.log('Testing typing deactivation after message send...');

  // Enqueue a message that should trigger typing and then deactivate it
  enqueueMessage({
    vk: mockVkApi,
    request: mockRequest,
    response: {
      peer_id: 12345,
      message: 'Test message',
      random_id: 12345
    },
    waitTicks: 1 // Short wait for testing
  });

  // Wait for the message to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Process the queue multiple times to simulate the tick system
  for (let i = 0; i < 5; i++) {
    await handleOutgoingMessage();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Test completed. Check the logs above for typing activation/deactivation messages.');
}

// Run the test only if this file is executed directly
if (require.main === module) {
  testTypingDeactivation().catch(console.error);
}

module.exports = { testTypingDeactivation };