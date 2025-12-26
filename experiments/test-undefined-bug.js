// Test script to reproduce the undefined logging bug
const { enqueueMessage } = require('../outgoing-messages');

console.log('Testing the undefined bug reproduction...');

// Mock context similar to what would be passed to enqueueMessage
const mockContext = {
  vk: null,
  request: { peerId: 12345 },
  response: {
    message: "Test message"
    // Note: no random_id set, so it will be generated
  }
};

console.log('Before calling enqueueMessage:');
console.log('mockContext.response.random_id:', mockContext.response.random_id);

// This should trigger the bug where it logs undefined
try {
  enqueueMessage(mockContext);
  console.log('enqueueMessage called successfully');
} catch (error) {
  console.error('Error calling enqueueMessage:', error);
}

console.log('After calling enqueueMessage:');
console.log('mockContext.response.random_id:', mockContext.response.random_id);