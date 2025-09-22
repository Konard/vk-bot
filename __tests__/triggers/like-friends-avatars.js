const { trigger } = require('../../triggers/like-friends-avatars');

describe('LikeFriendsAvatars Trigger', () => {
  test('should have correct trigger structure', () => {
    expect(trigger).toBeDefined();
    expect(trigger.name).toBe('LikeFriendsAvatars');
    expect(typeof trigger.action).toBe('function');
  });

  test('should handle empty context gracefully', async () => {
    const mockContext = {
      vk: {
        api: {
          friends: {
            get: jest.fn().mockResolvedValue({ items: [] })
          }
        }
      },
      options: { maxLikes: 1, minDelaySeconds: 1 }
    };

    // Mock the getAllFriends function to return empty array
    jest.doMock('../../friends-cache', () => ({
      getAllFriends: jest.fn().mockResolvedValue([])
    }));

    const result = await trigger.action(mockContext);
    // Should not throw error with empty friends list
    expect(result).toBeUndefined();
  });
});