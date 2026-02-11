const { trigger: randomLikesTrigger } = require('../../triggers/random-likes');

// Mock VK API responses
const mockVkApi = {
  users: {
    get: jest.fn()
  },
  wall: {
    get: jest.fn()
  },
  likes: {
    getList: jest.fn(),
    add: jest.fn()
  },
  friends: {
    getOnline: jest.fn()
  }
};

const mockContext = {
  vk: {
    api: mockVkApi
  }
};

describe('RandomLikes trigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock responses
    mockVkApi.users.get.mockResolvedValue([{
      id: 123456,
      photo_id: '123456_789'
    }]);

    mockVkApi.wall.get.mockResolvedValue({
      items: [{
        id: 1,
        is_pinned: 1
      }]
    });

    mockVkApi.likes.getList.mockResolvedValue({
      count: 2,
      items: [111, 222]
    });

    mockVkApi.friends.getOnline.mockResolvedValue({
      online: [333, 444],
      online_mobile: [555]
    });

    mockVkApi.likes.add.mockResolvedValue({ likes: 1 });
  });

  test('should execute without errors when online friends found', async () => {
    // Mock wall.get for friend content
    mockVkApi.wall.get.mockResolvedValueOnce({
      items: [{
        id: 1,
        is_pinned: 1
      }]
    }).mockResolvedValueOnce({
      items: [{
        id: 10,
        text: 'Test post'
      }]
    });

    await expect(randomLikesTrigger.action(mockContext)).resolves.not.toThrow();

    expect(mockVkApi.users.get).toHaveBeenCalledWith({
      fields: ['photo_id']
    });
    expect(mockVkApi.friends.getOnline).toHaveBeenCalledWith({
      online_mobile: 1
    });
  });

  test('should handle case when no online friends found', async () => {
    mockVkApi.friends.getOnline.mockResolvedValue({
      online: [],
      online_mobile: []
    });

    await expect(randomLikesTrigger.action(mockContext)).resolves.not.toThrow();

    expect(mockVkApi.friends.getOnline).toHaveBeenCalled();
    expect(mockVkApi.likes.add).not.toHaveBeenCalled();
  });

  test('should handle API errors gracefully', async () => {
    mockVkApi.users.get.mockRejectedValue(new Error('API Error'));

    await expect(randomLikesTrigger.action(mockContext)).resolves.not.toThrow();

    expect(mockVkApi.users.get).toHaveBeenCalled();
  });

  test('should handle access denied errors when liking content', async () => {
    const accessDeniedError = new Error('Access denied');
    accessDeniedError.code = 15;

    mockVkApi.wall.get.mockResolvedValueOnce({
      items: [{
        id: 1,
        is_pinned: 1
      }]
    }).mockResolvedValueOnce({
      items: [{
        id: 10,
        text: 'Test post'
      }]
    });

    mockVkApi.likes.add.mockRejectedValue(accessDeniedError);

    await expect(randomLikesTrigger.action(mockContext)).resolves.not.toThrow();

    expect(mockVkApi.likes.add).toHaveBeenCalled();
  });

  test('should have correct trigger name', () => {
    expect(randomLikesTrigger.name).toBe('RandomLikes');
  });

  test('should have action function', () => {
    expect(typeof randomLikesTrigger.action).toBe('function');
  });
});