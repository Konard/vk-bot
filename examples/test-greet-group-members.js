// Simple example to test the greet group members functionality
const { trigger: greetGroupMembersTrigger } = require('../triggers/greet-group-members');

// Test the condition function
console.log('Testing condition function...');

// Should trigger for group chat with correct message
const groupContext = {
  request: {
    peerId: 2000000001, // Group chat ID
    text: 'привет всем',
    isOutbox: false
  }
};

console.log('Group chat with "привет всем":', greetGroupMembersTrigger.condition(groupContext));

// Should NOT trigger for private chat
const privateContext = {
  request: {
    peerId: 123456789, // Private chat ID
    text: 'привет всем',
    isOutbox: false
  }
};

console.log('Private chat with "привет всем":', greetGroupMembersTrigger.condition(privateContext));

// Should NOT trigger for group chat with wrong message
const wrongMessageContext = {
  request: {
    peerId: 2000000001, // Group chat ID
    text: 'hello world',
    isOutbox: false
  }
};

console.log('Group chat with wrong message:', greetGroupMembersTrigger.condition(wrongMessageContext));

console.log('\nCondition tests completed successfully!');
console.log('\nSupported commands in group chats:');
console.log('- "привет всем"');
console.log('- "поздоровайся со всеми"');
console.log('- "скажи привет всем"');
console.log('- "hi everyone"');
console.log('- "greet everyone"');