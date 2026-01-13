// Test script to verify the react-to-cancelled-friendships trigger fix
const { trigger } = require('../triggers/react-to-cancelled-friendships');

// Mock VK API
const mockVK = {
  api: {
    friends: {
      getRequests: async () => ({ items: [123456] })
    },
    messages: {
      getConversationsById: async () => ({
        items: [{
          peer: { id: 123456 },
          can_write: { allowed: true },
          last_message_id: 1
        }]
      }),
      getById: async () => ({
        items: [{
          date: Math.floor(Date.now() / 1000),
          out: 1
        }]
      })
    },
    account: {
      ban: async () => {}
    }
  }
};

// Mock context with proper state structure
const mockContext = {
  vk: mockVK,
  options: { maxRequests: 1 },
  states: {
    123456: {
      history: [
        { text: 'Почему не хочешь больше дружить?', out: 1 }, // Message should be detected
        { text: 'Hello', out: 0 }
      ]
    }
  }
};

async function testTrigger() {
  console.log('Testing react-to-cancelled-friendships trigger...');

  // First run - should detect existing message and set flag
  await trigger.action(mockContext);

  console.log('State after first run:', mockContext.states[123456]);

  // Second run - should skip because flag is set
  await trigger.action(mockContext);

  console.log('State after second run:', mockContext.states[123456]);

  console.log('Test completed. Check that reactedToCancelledFriendRequest is set to true.');
}

testTrigger().catch(console.error);