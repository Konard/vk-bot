// Test that verifies the bot won't repeat friendship messages
const { trigger } = require('../triggers/react-to-cancelled-friendships');

// Mock a scenario where the bot has already sent the message
async function testNoRepetition() {
  console.log('Testing no message repetition scenario...');

  const mockVK = {
    api: {
      friends: {
        getRequests: async () => ({ items: [555777] }) // Friend with cancelled friendship
      },
      messages: {
        getConversationsById: async () => ({
          items: [{
            peer: { id: 555777 },
            can_write: { allowed: true },
            last_message_id: 100
          }]
        }),
        getById: async () => ({
          items: [{
            date: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
            out: 1
          }]
        })
      },
      account: {
        ban: async () => {}
      }
    }
  };

  let messagesSent = 0;

  // Mock the enqueuMessage function to count messages
  const { enqueueMessage } = require('../outgoing-messages');
  const originalEnqueue = enqueueMessage;

  // Patch enqueueMessage to count calls
  require('../outgoing-messages').enqueueMessage = function(params) {
    if (params.response.message && params.response.message.includes('дружить')) {
      messagesSent++;
      console.log('Friendship message would be sent:', params.response.message);
    }
    return originalEnqueue.call(this, params);
  };

  const mockContext = {
    vk: mockVK,
    options: { maxRequests: 1 },
    states: {
      555777: {
        history: [
          { text: 'Почему не хочешь больше дружить?', out: 1 }, // Already sent this message
          { text: 'Привет!', out: 1 },
          { text: 'Как дела?', out: 0 }
        ]
      }
    }
  };

  console.log('Running trigger first time (should detect existing message and not send new one)...');
  await trigger.action(mockContext);

  console.log('Running trigger second time (should still not send message)...');
  await trigger.action(mockContext);

  console.log(`Total friendship messages that would be sent: ${messagesSent}`);
  console.log('Final state:', mockContext.states[555777].reactedToCancelledFriendRequest);

  if (messagesSent === 0) {
    console.log('✅ SUCCESS: No duplicate messages sent!');
  } else {
    console.log('❌ FAILURE: Duplicate messages were sent!');
  }

  // Restore original function
  require('../outgoing-messages').enqueueMessage = originalEnqueue;
}

testNoRepetition().catch(console.error);