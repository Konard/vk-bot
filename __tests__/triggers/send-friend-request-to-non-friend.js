const { trigger } = require('../../triggers/send-friend-request-to-non-friend');
const { getAllFriends } = require('../../friends-cache');
const { DateTime } = require('luxon');

jest.mock('../../friends-cache');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  sleep: jest.fn().mockResolvedValue(undefined),
}));

const triggerDescription = 'send friend request to non-friend trigger';

describe(triggerDescription, () => {
  let mockVk;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVk = {
      api: {
        friends: {
          add: jest.fn().mockResolvedValue({}),
        },
      },
    };

    getAllFriends.mockResolvedValue([
      { id: 123 },
      { id: 456 },
      { id: 789 },
    ]);
  });

  test('condition returns true for incoming message from user', async () => {
    const context = {
      request: {
        peerType: 'user',
        isOutbox: false,
        senderId: 999,
      },
      state: {},
    };

    const result = await trigger.condition(context);
    expect(result).toBe(true);
  });

  test('condition returns false for outgoing messages', async () => {
    const context = {
      request: {
        peerType: 'user',
        isOutbox: true,
        senderId: 999,
      },
    };

    const result = await trigger.condition(context);
    expect(result).toBe(false);
  });

  test('condition returns false for non-user messages (groups/chats)', async () => {
    const context = {
      request: {
        peerType: 'chat',
        isOutbox: false,
        senderId: 999,
      },
    };

    const result = await trigger.condition(context);
    expect(result).toBe(false);
  });

  test('condition returns false if triggered recently (within 7 days)', async () => {
    const context = {
      request: {
        peerType: 'user',
        isOutbox: false,
        senderId: 999,
      },
      state: {
        triggers: {
          SendFriendRequestToNonFriend: {
            lastTriggered: DateTime.now().minus({ days: 3 }),
          },
        },
      },
    };

    const result = await trigger.condition(context);
    expect(result).toBe(false);
  });

  test('condition returns true if triggered more than 7 days ago', async () => {
    const context = {
      request: {
        peerType: 'user',
        isOutbox: false,
        senderId: 999,
      },
      state: {
        triggers: {
          SendFriendRequestToNonFriend: {
            lastTriggered: DateTime.now().minus({ days: 8 }),
          },
        },
      },
    };

    const result = await trigger.condition(context);
    expect(result).toBe(true);
  });

  test('action sends friend request to non-friend', async () => {
    const context = {
      request: {
        senderId: 999,
      },
      vk: mockVk,
    };

    await trigger.action(context);

    expect(getAllFriends).toHaveBeenCalledWith({ context });
    expect(mockVk.api.friends.add).toHaveBeenCalledWith({ user_id: 999 });
  });

  test('action does not send friend request if user is already a friend', async () => {
    const context = {
      request: {
        senderId: 123, // This ID is in the mocked friends list
      },
      vk: mockVk,
    };

    await trigger.action(context);

    expect(getAllFriends).toHaveBeenCalledWith({ context });
    expect(mockVk.api.friends.add).not.toHaveBeenCalled();
  });

  test('action handles error 174 (already friend or request sent)', async () => {
    const context = {
      request: {
        senderId: 999,
      },
      vk: mockVk,
    };

    mockVk.api.friends.add.mockRejectedValue({ code: 174 });

    await expect(trigger.action(context)).resolves.not.toThrow();
    expect(mockVk.api.friends.add).toHaveBeenCalled();
  });

  test('action handles error 177 (user not found)', async () => {
    const context = {
      request: {
        senderId: 999,
      },
      vk: mockVk,
    };

    mockVk.api.friends.add.mockRejectedValue({ code: 177 });

    await expect(trigger.action(context)).resolves.not.toThrow();
    expect(mockVk.api.friends.add).toHaveBeenCalled();
  });

  test('action handles error 242 (too many friends)', async () => {
    const context = {
      request: {
        senderId: 999,
      },
      vk: mockVk,
    };

    mockVk.api.friends.add.mockRejectedValue({ code: 242 });

    await expect(trigger.action(context)).resolves.not.toThrow();
    expect(mockVk.api.friends.add).toHaveBeenCalled();
  });

  test('action handles error 29 (rate limit)', async () => {
    const context = {
      request: {
        senderId: 999,
      },
      vk: mockVk,
    };

    mockVk.api.friends.add.mockRejectedValue({ code: 29 });

    await expect(trigger.action(context)).resolves.not.toThrow();
    expect(mockVk.api.friends.add).toHaveBeenCalled();
  });

  test('action handles error 15 (access denied)', async () => {
    const context = {
      request: {
        senderId: 999,
      },
      vk: mockVk,
    };

    mockVk.api.friends.add.mockRejectedValue({ code: 15 });

    await expect(trigger.action(context)).resolves.not.toThrow();
    expect(mockVk.api.friends.add).toHaveBeenCalled();
  });
});
