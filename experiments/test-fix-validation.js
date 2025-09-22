// Test script to validate the fix for the undefined logging bug
const { enqueueMessage } = require('../outgoing-messages');

console.log('Testing the fix for undefined bug...');

// Test case 1: response without random_id (should generate one)
const mockContext1 = {
  vk: null,
  request: { peerId: 12345 },
  response: {
    message: "Test message without random_id"
  }
};

console.log('\n=== Test Case 1: No random_id ===');
console.log('Before enqueueMessage:');
console.log('mockContext1.response.random_id:', mockContext1.response.random_id);

enqueueMessage(mockContext1);

console.log('After enqueueMessage:');
console.log('mockContext1.response.random_id:', mockContext1.response.random_id);

// Test case 2: response with existing random_id (should keep it)
const mockContext2 = {
  vk: null,
  request: { peerId: 67890 },
  response: {
    message: "Test message with existing random_id",
    random_id: 999999
  }
};

console.log('\n=== Test Case 2: Existing random_id ===');
console.log('Before enqueueMessage:');
console.log('mockContext2.response.random_id:', mockContext2.response.random_id);

enqueueMessage(mockContext2);

console.log('After enqueueMessage:');
console.log('mockContext2.response.random_id:', mockContext2.response.random_id);

console.log('\n=== Fix validation complete ===');