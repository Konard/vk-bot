const { trigger: autoMuteOnInviteTrigger } = require('../../triggers/auto-mute-on-invite');

describe('AutoMuteOnInvite Trigger', () => {
  let mockVk;
  let mockRequest;

  beforeEach(() => {
    mockVk = {
      api: {
        users: {
          get: jest.fn()
        },
        messages: {
          setConversationMember: jest.fn()
        },
        account: {
          setPushSettings: jest.fn(),
          setSilenceMode: jest.fn()
        }
      }
    };

    mockRequest = {
      peerId: 2000000001,
      isEvent: false,
      eventType: null,
      eventMemberId: null
    };
  });

  test('should ignore non-event messages', async () => {
    mockRequest.isEvent = false;

    await autoMuteOnInviteTrigger.action({ vk: mockVk, request: mockRequest });

    expect(mockVk.api.users.get).not.toHaveBeenCalled();
  });

  test('should ignore non-chat_invite_user events', async () => {
    mockRequest.isEvent = true;
    mockRequest.eventType = 'chat_photo_update';

    await autoMuteOnInviteTrigger.action({ vk: mockVk, request: mockRequest });

    expect(mockVk.api.users.get).not.toHaveBeenCalled();
  });

  test('should ignore when other users are invited', async () => {
    mockRequest.isEvent = true;
    mockRequest.eventType = 'chat_invite_user';
    mockRequest.eventMemberId = 123456;

    mockVk.api.users.get.mockResolvedValue([{ id: 789012 }]);

    await autoMuteOnInviteTrigger.action({ vk: mockVk, request: mockRequest });

    expect(mockVk.api.messages.setConversationMember).not.toHaveBeenCalled();
  });

  test('should mute conversation when bot is invited using setConversationMember', async () => {
    const botUserId = 789012;
    mockRequest.isEvent = true;
    mockRequest.eventType = 'chat_invite_user';
    mockRequest.eventMemberId = botUserId;

    mockVk.api.users.get.mockResolvedValue([{ id: botUserId }]);
    mockVk.api.messages.setConversationMember.mockResolvedValue({});

    await autoMuteOnInviteTrigger.action({ vk: mockVk, request: mockRequest });

    expect(mockVk.api.messages.setConversationMember).toHaveBeenCalledWith({
      peer_id: mockRequest.peerId,
      member_id: botUserId,
      push_settings: 'disabled'
    });
  });

  test('should fallback to setPushSettings when setConversationMember fails', async () => {
    const botUserId = 789012;
    mockRequest.isEvent = true;
    mockRequest.eventType = 'chat_invite_user';
    mockRequest.eventMemberId = botUserId;

    mockVk.api.users.get.mockResolvedValue([{ id: botUserId }]);
    mockVk.api.messages.setConversationMember.mockRejectedValue(new Error('Method not available'));
    mockVk.api.account.setPushSettings.mockResolvedValue({});

    await autoMuteOnInviteTrigger.action({ vk: mockVk, request: mockRequest });

    expect(mockVk.api.account.setPushSettings).toHaveBeenCalledWith({
      peer_id: mockRequest.peerId,
      sound: 0,
      disabled_until: -1
    });
  });

  test('should fallback to setSilenceMode when other methods fail', async () => {
    const botUserId = 789012;
    mockRequest.isEvent = true;
    mockRequest.eventType = 'chat_invite_user';
    mockRequest.eventMemberId = botUserId;

    mockVk.api.users.get.mockResolvedValue([{ id: botUserId }]);
    mockVk.api.messages.setConversationMember.mockRejectedValue(new Error('Method not available'));
    mockVk.api.account.setPushSettings.mockRejectedValue(new Error('Method not available'));
    mockVk.api.account.setSilenceMode.mockResolvedValue({});

    await autoMuteOnInviteTrigger.action({ vk: mockVk, request: mockRequest });

    expect(mockVk.api.account.setSilenceMode).toHaveBeenCalledWith({
      peer_id: mockRequest.peerId,
      time: -1
    });
  });
});