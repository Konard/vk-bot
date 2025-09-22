const { trigger: sendCommentsToCommunitiesTrigger } = require('../../triggers/send-comments-to-communities');

// Mock the utils module to avoid long sleeps in tests
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  sleep: jest.fn().mockResolvedValue(undefined),
  getRandomElement: jest.fn().mockReturnValue('test message')
}));

const triggerDescription = 'send comments to communities trigger';

describe(triggerDescription, () => {
  test('trigger has correct structure', () => {
    expect(sendCommentsToCommunitiesTrigger).toBeDefined();
    expect(sendCommentsToCommunitiesTrigger.name).toBe('SendCommentsToCommunities');
    expect(typeof sendCommentsToCommunitiesTrigger.action).toBe('function');
  });

  test('trigger action completes successfully with empty posts', async () => {
    const mockVkApi = {
      api: {
        wall: {
          get: jest.fn().mockResolvedValue({ items: [] }),
          getComments: jest.fn().mockResolvedValue({ items: [] }),
          createComment: jest.fn().mockResolvedValue({ comment_id: 123 })
        },
        users: {
          get: jest.fn().mockResolvedValue([{ id: 12345 }])
        }
      }
    };

    const context = { vk: mockVkApi };

    await expect(sendCommentsToCommunitiesTrigger.action(context)).resolves.not.toThrow();
    expect(mockVkApi.api.wall.get).toHaveBeenCalled();
  }, 10000);
});