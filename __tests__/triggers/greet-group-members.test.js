// Mock the dependencies before requiring the module
jest.mock('../../utils', () => ({
  sleep: jest.fn().mockResolvedValue(),
  second: 1000,
  ms: 1,
  getRandomElement: jest.fn().mockReturnValue(12345) // Mock sticker ID
}));

jest.mock('../../outgoing-messages', () => ({
  sendMessage: jest.fn().mockResolvedValue()
}));

const { trigger: greetGroupMembersTrigger } = require('../../triggers/greet-group-members');

describe('GreetGroupMembers trigger', () => {
  const triggerDescription = 'greet group members trigger';

  describe('condition tests', () => {
    test.each([
      ['привет всем'],
      ['Привет всем!'],
      ['поздоровайся со всеми'],
      ['Скажи привет всем'],
      ['hi everyone'],
      ['greet everyone'],
    ])(`"%s" message in group chat triggers ${triggerDescription}`, (message) => {
      const context = {
        request: {
          peerId: 2000000001, // Group chat ID
          text: message,
          isOutbox: false
        }
      };
      expect(greetGroupMembersTrigger.condition(context)).toBe(true);
    });

    test.each([
      ['привет всем'],
      ['поздоровайся со всеми'],
      ['hi everyone'],
    ])(`"%s" message in private chat does NOT trigger ${triggerDescription}`, (message) => {
      const context = {
        request: {
          peerId: 123456789, // Private chat ID (less than 2000000000)
          text: message,
          isOutbox: false
        }
      };
      expect(greetGroupMembersTrigger.condition(context)).toBe(false);
    });

    test.each([
      ['привет'],
      ['hello'],
      ['как дела?'],
      ['random message'],
    ])(`"%s" message in group chat does NOT trigger ${triggerDescription}`, (message) => {
      const context = {
        request: {
          peerId: 2000000001, // Group chat ID
          text: message,
          isOutbox: false
        }
      };
      expect(greetGroupMembersTrigger.condition(context)).toBe(false);
    });

    test(`outbox message does NOT trigger ${triggerDescription}`, () => {
      const context = {
        request: {
          peerId: 2000000001, // Group chat ID
          text: 'привет всем',
          isOutbox: true
        }
      };
      expect(greetGroupMembersTrigger.condition(context)).toBe(false);
    });

    test(`empty text does NOT trigger ${triggerDescription}`, () => {
      const context = {
        request: {
          peerId: 2000000001, // Group chat ID
          text: '',
          isOutbox: false
        }
      };
      expect(greetGroupMembersTrigger.condition(context)).toBe(false);
    });

    test(`null text does NOT trigger ${triggerDescription}`, () => {
      const context = {
        request: {
          peerId: 2000000001, // Group chat ID
          text: null,
          isOutbox: false
        }
      };
      expect(greetGroupMembersTrigger.condition(context)).toBe(false);
    });
  });

  describe('action tests', () => {
    let mockVk;
    let mockSendMessage;

    beforeEach(() => {
      // Mock VK API
      mockVk = {
        api: {
          messages: {
            getConversationMembers: jest.fn(),
            getConversationsById: jest.fn()
          }
        }
      };

      // Get the mocked sendMessage function
      mockSendMessage = require('../../outgoing-messages').sendMessage;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should handle successful greeting of group members', async () => {
      // Mock successful API responses
      mockVk.api.messages.getConversationMembers.mockResolvedValue({
        items: [
          { member_id: 123456 },
          { member_id: 789012 },
          { member_id: 345678 }
        ]
      });

      mockVk.api.messages.getConversationsById.mockResolvedValue({
        items: [{ can_write: { allowed: true } }]
      });

      mockSendMessage.mockResolvedValue();

      const context = {
        vk: mockVk,
        request: {
          peerId: 2000000001,
          text: 'привет всем',
          isOutbox: false
        }
      };

      await greetGroupMembersTrigger.action(context);

      // Verify API calls
      expect(mockVk.api.messages.getConversationMembers).toHaveBeenCalledWith({
        peer_id: 2000000001
      });

      // Should check each member's conversation
      expect(mockVk.api.messages.getConversationsById).toHaveBeenCalledTimes(3);

      // Should send greeting to each member + confirmation to group
      expect(mockSendMessage).toHaveBeenCalledTimes(4); // 3 members + 1 group confirmation
    }, 10000);

    test('should handle API error gracefully', async () => {
      // Mock API error
      mockVk.api.messages.getConversationMembers.mockRejectedValue(
        new Error('API Error')
      );

      mockSendMessage.mockResolvedValue();

      const context = {
        vk: mockVk,
        request: {
          peerId: 2000000001,
          text: 'привет всем',
          isOutbox: false
        }
      };

      await greetGroupMembersTrigger.action(context);

      // Should send error message to group
      expect(mockSendMessage).toHaveBeenCalledWith({
        vk: mockVk,
        response: {
          peer_id: 2000000001,
          message: 'Извините, не удалось получить список участников группы 😔'
        }
      });
    }, 10000);
  });
});