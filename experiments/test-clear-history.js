const { trigger: clearHistoryTrigger, maxMessages } = require('../triggers/clear-history');

// Mock VK API context for testing
const mockContext = {
  vk: {
    api: {
      messages: {
        getConversations: async () => ({
          items: [
            {
              conversation: {
                peer: { id: 123456 }
              }
            },
            {
              conversation: {
                peer: { id: 789012 }
              }
            }
          ]
        }),
        getHistory: async ({ peer_id }) => ({
          count: peer_id === 123456 ? 6000 : 500  // First chat exceeds limit, second doesn't
        }),
        deleteDialog: async ({ peer_id }) => {
          console.log(`Mock: Would delete dialog for peer ${peer_id}`);
          return {};
        }
      }
    }
  },
  states: {
    123456: { history: ['some', 'messages'] },
    789012: { history: ['other', 'messages'] }
  }
};

// Mock the messages cache
jest.mock('../messages-cache', () => ({
  getCache: async () => ({
    del: async (key) => {
      console.log(`Mock: Would clear cache for ${key}`);
    }
  }),
  loadMessages: async ({ context, friendId }) => {
    console.log(`Mock: Would load messages for ${friendId}`);
    return [];
  }
}));

async function testClearHistory() {
  console.log('Testing ClearHistoryTrigger...');
  console.log(`Max messages threshold: ${maxMessages}`);

  try {
    await clearHistoryTrigger.action(mockContext);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  testClearHistory();
}

module.exports = { testClearHistory };