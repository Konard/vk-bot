const { trigger } = require('../../triggers/like-in-response-to-likes');

const triggerDescription = 'like in response to likes trigger';

describe(triggerDescription, () => {
  let mockVk;
  let mockContext;

  beforeEach(() => {
    mockVk = {
      api: {
        users: {
          get: jest.fn().mockResolvedValue([{ id: 12345 }])
        },
        likes: {
          add: jest.fn().mockResolvedValue({})
        }
      }
    };

    mockContext = {
      vk: mockVk,
      likerId: 67890,
      objectId: 111,
      objectType: 'post',
      objectOwnerId: 222,
      postId: 333
    };
  });

  it('should like back a post when someone likes our post', async () => {
    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).toHaveBeenCalledWith({
      type: 'post',
      owner_id: 222,
      item_id: 111
    });
  });

  it('should like back a comment when someone likes our comment', async () => {
    mockContext.objectType = 'comment';

    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).toHaveBeenCalledWith({
      type: 'comment',
      owner_id: 222,
      item_id: 111
    });
  });

  it('should like back a photo when someone likes our photo', async () => {
    mockContext.objectType = 'photo';

    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).toHaveBeenCalledWith({
      type: 'photo',
      owner_id: 222,
      item_id: 111
    });
  });

  it('should like back a video when someone likes our video', async () => {
    mockContext.objectType = 'video';

    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).toHaveBeenCalledWith({
      type: 'video',
      owner_id: 222,
      item_id: 111
    });
  });

  it('should ignore likes from the bot itself', async () => {
    mockContext.likerId = 12345; // Same as bot ID

    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).not.toHaveBeenCalled();
  });

  it('should handle unknown object types gracefully', async () => {
    mockContext.objectType = 'unknown';

    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).not.toHaveBeenCalled();
  });

  it('should handle already liked objects gracefully', async () => {
    const alreadyLikedError = new Error('Already liked');
    alreadyLikedError.code = 15;
    mockVk.api.likes.add.mockRejectedValue(alreadyLikedError);

    await trigger.action(mockContext);

    expect(mockVk.api.likes.add).toHaveBeenCalled();
    // Should not throw error
  });
});