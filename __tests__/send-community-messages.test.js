const {
  trigger,
  sendCommunityMessages,
  isUserInCommunities,
  getMessageForGender,
} = require('../triggers/send-community-messages');

// Mock dependencies
jest.mock('../utils', () => ({
  sleep: jest.fn(() => Promise.resolve()),
  getRandomElement: jest.fn((arr) => arr[0]), // Always return first element for predictable testing
  second: 1000,
  ms: 1,
}));

jest.mock('../outgoing-messages', () => ({
  enqueueMessage: jest.fn(() => Promise.resolve()),
}));

jest.mock('../friends-cache', () => ({
  getAllFriends: jest.fn(),
}));

const { enqueueMessage } = require('../outgoing-messages');
const { getAllFriends } = require('../friends-cache');

describe('send-community-messages trigger', () => {
  let mockVk;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVk = {
      api: {
        groups: {
          isMember: jest.fn(),
        },
      },
    };
  });

  describe('getMessageForGender', () => {
    test('should return female message for sex = 1', () => {
      const message = getMessageForGender(1);
      expect(message).toBe("Привет! 👋 Как дела, подруга?"); // First message in female templates
    });

    test('should return male message for sex = 2', () => {
      const message = getMessageForGender(2);
      expect(message).toBe("Привет! 👋 Как дела, друг?"); // First message in male templates
    });

    test('should return default message for sex = 0', () => {
      const message = getMessageForGender(0);
      expect(message).toBe("Привет! 👋 Как дела?"); // First message in default templates
    });

    test('should return default message for undefined sex', () => {
      const message = getMessageForGender(undefined);
      expect(message).toBe("Привет! 👋 Как дела?"); // First message in default templates
    });
  });

  describe('isUserInCommunities', () => {
    test('should return true if user is member of any community', async () => {
      mockVk.api.groups.isMember
        .mockResolvedValueOnce(0) // Not a member of first community
        .mockResolvedValueOnce(1); // Member of second community

      const result = await isUserInCommunities(mockVk, 12345, [111, 222]);

      expect(result).toBe(true);
      expect(mockVk.api.groups.isMember).toHaveBeenCalledTimes(2);
      expect(mockVk.api.groups.isMember).toHaveBeenCalledWith({
        group_id: 111,
        user_id: 12345,
      });
      expect(mockVk.api.groups.isMember).toHaveBeenCalledWith({
        group_id: 222,
        user_id: 12345,
      });
    });

    test('should return false if user is not member of any community', async () => {
      mockVk.api.groups.isMember
        .mockResolvedValueOnce(0) // Not a member of first community
        .mockResolvedValueOnce(0); // Not a member of second community

      const result = await isUserInCommunities(mockVk, 12345, [111, 222]);

      expect(result).toBe(false);
      expect(mockVk.api.groups.isMember).toHaveBeenCalledTimes(2);
    });

    test('should return false on API error', async () => {
      mockVk.api.groups.isMember.mockRejectedValue(new Error('API Error'));

      const result = await isUserInCommunities(mockVk, 12345, [111]);

      expect(result).toBe(false);
      expect(mockVk.api.groups.isMember).toHaveBeenCalledTimes(1);
    });

    test('should stop checking after finding membership', async () => {
      mockVk.api.groups.isMember
        .mockResolvedValueOnce(1); // Member of first community

      const result = await isUserInCommunities(mockVk, 12345, [111, 222, 333]);

      expect(result).toBe(true);
      expect(mockVk.api.groups.isMember).toHaveBeenCalledTimes(1); // Should not check other communities
    });
  });

  describe('sendCommunityMessages', () => {
    const mockFriends = [
      {
        id: 1,
        sex: 1, // Female
        can_write_private_message: true,
        deactivated: false,
      },
      {
        id: 2,
        sex: 2, // Male
        can_write_private_message: true,
        deactivated: false,
      },
      {
        id: 3,
        sex: 0, // Unknown
        can_write_private_message: false, // Cannot write
        deactivated: false,
      },
      {
        id: 4,
        sex: 1, // Female
        can_write_private_message: true,
        deactivated: true, // Deactivated
      },
      {
        id: 5,
        sex: 2, // Male
        can_write_private_message: true,
        deactivated: false,
      },
    ];

    beforeEach(() => {
      getAllFriends.mockResolvedValue(mockFriends);
    });

    test('should skip if no community IDs provided', async () => {
      const context = {
        vk: mockVk,
        options: {
          communityIds: [],
        },
      };

      await sendCommunityMessages(context);

      expect(getAllFriends).not.toHaveBeenCalled();
      expect(enqueueMessage).not.toHaveBeenCalled();
    });

    test('should send text messages to friends in communities', async () => {
      // Mock community membership - all checked friends are members
      mockVk.api.groups.isMember.mockResolvedValue(1); // All friends are members

      const context = {
        vk: mockVk,
        options: {
          communityIds: [111],
          maxMessages: 10,
          sendStickers: false,
          includeSticker: false,
          delayBetweenChecks: 0,
        },
      };

      await sendCommunityMessages(context);

      // Should check membership for friends 1, 2, and 5 (skipping 3 and 4)
      expect(mockVk.api.groups.isMember).toHaveBeenCalledTimes(3);

      // Should send messages to friends 1, 2, and 5 (all members)
      expect(enqueueMessage).toHaveBeenCalledTimes(3);

      // Check that all calls have messages and no stickers
      const calls = enqueueMessage.mock.calls;
      const peerIds = calls.map(call => call[0].peer_id);

      // Should include friends 1, 2, and 5
      expect(peerIds).toContain(1);
      expect(peerIds).toContain(2);
      expect(peerIds).toContain(5);

      // All calls should have messages but no stickers
      calls.forEach(call => {
        expect(call[0].message).toBeDefined();
        expect(call[0].sticker_id).toBeUndefined();
      });
    });

    test('should send only stickers when sendStickers is true', async () => {
      mockVk.api.groups.isMember.mockResolvedValue(1); // All checked friends are members

      const context = {
        vk: mockVk,
        options: {
          communityIds: [111],
          maxMessages: 5,
          sendStickers: true,
          includeSticker: false,
          delayBetweenChecks: 0,
        },
      };

      await sendCommunityMessages(context);

      // Should send stickers to friends 1, 2, and 5
      expect(enqueueMessage).toHaveBeenCalledTimes(3);

      // All calls should have sticker_id but no message
      enqueueMessage.mock.calls.forEach(call => {
        expect(call[0].sticker_id).toBeDefined();
        expect(call[0].message).toBeUndefined();
      });
    });

    test('should send text with stickers when includeSticker is true', async () => {
      mockVk.api.groups.isMember.mockResolvedValue(1); // All checked friends are members

      const context = {
        vk: mockVk,
        options: {
          communityIds: [111],
          maxMessages: 5,
          sendStickers: false,
          includeSticker: true,
          delayBetweenChecks: 0,
        },
      };

      await sendCommunityMessages(context);

      // Should send messages with stickers to friends 1, 2, and 5
      expect(enqueueMessage).toHaveBeenCalledTimes(3);

      // All calls should have both message and sticker_id
      enqueueMessage.mock.calls.forEach(call => {
        expect(call[0].sticker_id).toBeDefined();
        expect(call[0].message).toBeDefined();
      });
    });

    test('should respect maxMessages limit', async () => {
      mockVk.api.groups.isMember.mockResolvedValue(1); // All checked friends are members

      const context = {
        vk: mockVk,
        options: {
          communityIds: [111],
          maxMessages: 1, // Limit to 1 message
          sendStickers: false,
          includeSticker: false,
          delayBetweenChecks: 0,
        },
      };

      await sendCommunityMessages(context);

      // Should only send 1 message despite having 3 eligible friends
      expect(enqueueMessage).toHaveBeenCalledTimes(1);
    });

    test('should skip friends who cannot receive messages', async () => {
      mockVk.api.groups.isMember.mockResolvedValue(1);

      const context = {
        vk: mockVk,
        options: {
          communityIds: [111],
          maxMessages: 10,
          sendStickers: false,
          includeSticker: false,
          delayBetweenChecks: 0,
        },
      };

      await sendCommunityMessages(context);

      // Should only check friends 1, 2, and 5 (skip friend 3 who can't receive messages, and friend 4 who is deactivated)
      expect(mockVk.api.groups.isMember).toHaveBeenCalledTimes(3);
    });
  });

  describe('trigger object', () => {
    test('should have correct name and action', () => {
      expect(trigger.name).toBe('SendCommunityMessages');
      expect(typeof trigger.action).toBe('function');
    });

    test('should call sendCommunityMessages when action is executed', async () => {
      const context = {
        vk: mockVk,
        options: {
          communityIds: [],
        },
      };

      await trigger.action(context);

      // Should not throw and should handle empty communities gracefully
      expect(getAllFriends).not.toHaveBeenCalled();
    });
  });
});