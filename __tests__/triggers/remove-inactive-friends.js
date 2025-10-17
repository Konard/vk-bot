const { trigger: removeInactiveFriendsTrigger } = require('../../triggers/remove-inactive-friends');
const { getAllFriends, loadAllFriends } = require('../../friends-cache');
const { priorityFriendIds } = require('../../utils');

jest.mock('../../friends-cache');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  sleep: jest.fn(() => Promise.resolve()),
}));

const triggerDescription = 'remove inactive friends trigger';

describe(triggerDescription, () => {
  let mockVk;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVk = {
      api: {
        friends: {
          getRequests: jest.fn(),
          delete: jest.fn(),
        },
      },
    };
  });

  test('should not remove friends when there are no incoming requests', async () => {
    mockVk.api.friends.getRequests.mockResolvedValue({ count: 0, items: [] });

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.getRequests).toHaveBeenCalledWith({ count: 1, out: 0 });
    expect(mockVk.api.friends.delete).not.toHaveBeenCalled();
  });

  test('should not remove friends when current count is below maximum', async () => {
    mockVk.api.friends.getRequests.mockResolvedValue({ count: 5, items: [1, 2, 3, 4, 5] });
    getAllFriends.mockResolvedValue([
      { id: 1000, last_seen: { time: 1000000000 } },
      { id: 1001, last_seen: { time: 1000000001 } },
    ]);

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.delete).not.toHaveBeenCalled();
  });

  test('should remove most inactive friends when at maximum capacity', async () => {
    const friends = [];
    for (let i = 0; i < 10000; i++) {
      friends.push({
        id: 10000 + i,
        last_seen: { time: 1000000000 + i },
        online: 0,
      });
    }

    mockVk.api.friends.getRequests.mockResolvedValue({ count: 3, items: [1, 2, 3] });
    getAllFriends.mockResolvedValue(friends);
    loadAllFriends.mockResolvedValue(friends.slice(3));
    mockVk.api.friends.delete.mockResolvedValue({ success: 1 });

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.delete).toHaveBeenCalledTimes(3);
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10000 }); // Most inactive
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10001 });
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10002 });
    expect(loadAllFriends).toHaveBeenCalled();
  });

  test('should not remove priority friends', async () => {
    const friends = [
      { id: priorityFriendIds[0], last_seen: { time: 1000000000 }, online: 0 }, // Priority friend, very inactive
      { id: 10001, last_seen: { time: 1000000001 }, online: 0 },
      { id: 10002, last_seen: { time: 1000000002 }, online: 0 },
    ];

    // Add more friends to reach 10000
    for (let i = 3; i < 10000; i++) {
      friends.push({
        id: 10000 + i,
        last_seen: { time: 1000000000 + i },
        online: 0,
      });
    }

    mockVk.api.friends.getRequests.mockResolvedValue({ count: 2, items: [1, 2] });
    getAllFriends.mockResolvedValue(friends);
    loadAllFriends.mockResolvedValue(friends.slice(2));
    mockVk.api.friends.delete.mockResolvedValue({ success: 1 });

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.delete).toHaveBeenCalledTimes(2);
    expect(mockVk.api.friends.delete).not.toHaveBeenCalledWith({ user_id: priorityFriendIds[0] });
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10001 }); // Most inactive non-priority
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10002 });
  });

  test('should not remove deactivated friends', async () => {
    const friends = [
      { id: 10000, deactivated: 'deleted', last_seen: { time: 1000000000 } }, // Deactivated, very inactive
      { id: 10001, last_seen: { time: 1000000001 }, online: 0 },
      { id: 10002, last_seen: { time: 1000000002 }, online: 0 },
    ];

    // Add more friends to reach 10000
    for (let i = 3; i < 10000; i++) {
      friends.push({
        id: 10000 + i,
        last_seen: { time: 1000000000 + i },
        online: 0,
      });
    }

    mockVk.api.friends.getRequests.mockResolvedValue({ count: 2, items: [1, 2] });
    getAllFriends.mockResolvedValue(friends);
    loadAllFriends.mockResolvedValue(friends.slice(2));
    mockVk.api.friends.delete.mockResolvedValue({ success: 1 });

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.delete).toHaveBeenCalledTimes(2);
    expect(mockVk.api.friends.delete).not.toHaveBeenCalledWith({ user_id: 10000 }); // Deactivated
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10001 }); // Most inactive non-deactivated
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10002 });
  });

  test('should prioritize removing friends without last_seen data', async () => {
    const friends = [
      { id: 10000, online: 0 }, // No last_seen data
      { id: 10001, last_seen: { time: 1000000001 }, online: 0 },
      { id: 10002, last_seen: { time: 1000000002 }, online: 0 },
    ];

    // Add more friends to reach 10000
    for (let i = 3; i < 10000; i++) {
      friends.push({
        id: 10000 + i,
        last_seen: { time: 1000000000 + i },
        online: 0,
      });
    }

    mockVk.api.friends.getRequests.mockResolvedValue({ count: 2, items: [1, 2] });
    getAllFriends.mockResolvedValue(friends);
    loadAllFriends.mockResolvedValue(friends.slice(2));
    mockVk.api.friends.delete.mockResolvedValue({ success: 1 });

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.delete).toHaveBeenCalledTimes(2);
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10000 }); // No last_seen
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10001 }); // Oldest last_seen
  });

  test('should prioritize removing offline friends over online friends', async () => {
    const friends = [
      { id: 10000, last_seen: { time: 1000000000 }, online: 0 }, // Offline
      { id: 10001, last_seen: { time: 999999999 }, online: 1 }, // Online but older last_seen
      { id: 10002, last_seen: { time: 1000000001 }, online: 0 }, // Offline
    ];

    // Add more friends to reach 10000
    for (let i = 3; i < 10000; i++) {
      friends.push({
        id: 10000 + i,
        last_seen: { time: 1000000000 + i },
        online: 0,
      });
    }

    mockVk.api.friends.getRequests.mockResolvedValue({ count: 2, items: [1, 2] });
    getAllFriends.mockResolvedValue(friends);
    loadAllFriends.mockResolvedValue(friends.slice(2));
    mockVk.api.friends.delete.mockResolvedValue({ success: 1 });

    await removeInactiveFriendsTrigger.action({ vk: mockVk });

    expect(mockVk.api.friends.delete).toHaveBeenCalledTimes(2);
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10000 }); // Offline
    expect(mockVk.api.friends.delete).toHaveBeenCalledWith({ user_id: 10002 }); // Offline
    expect(mockVk.api.friends.delete).not.toHaveBeenCalledWith({ user_id: 10001 }); // Online, should be preserved
  });
});
