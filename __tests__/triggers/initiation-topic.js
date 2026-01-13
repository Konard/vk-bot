const { trigger: initiationTopicTrigger, initiationTopicQuestions } = require('../../triggers/initiation-topic');
const { enqueueMessage } = require('../../outgoing-messages');
const { DateTime } = require('luxon');

jest.mock('../../outgoing-messages');

const triggerDescription = 'initiation topic trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
    // Reset Math.random mock
    jest.spyOn(Math, 'random').mockRestore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should not trigger for group conversations', () => {
    const context = {
      request: {
        peerType: "chat",
        isOutbox: false
      },
      state: { history: Array(10).fill({ date: DateTime.now().toSeconds() }) }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should not trigger for outgoing messages', () => {
    const context = {
      request: {
        peerType: "user",
        isOutbox: true
      },
      state: { history: Array(10).fill({ date: DateTime.now().toSeconds() }) }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should not trigger if recently triggered (less than 7 days)', () => {
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: Array(10).fill({ date: DateTime.now().toSeconds() }),
        triggers: {
          'InitiationTopicTrigger': {
            lastTriggered: DateTime.now().minus({ days: 3 })
          }
        }
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should not trigger with insufficient conversation history (less than 5 messages)', () => {
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: Array(3).fill({ date: DateTime.now().toSeconds() })
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should not trigger with insufficient recent activity (less than 2 recent messages)', () => {
    const oldMessages = Array(10).fill({
      date: DateTime.now().minus({ days: 10 }).toSeconds(),
      text: 'old message'
    });
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: oldMessages
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should not trigger with too much recent activity (more than 10 recent messages)', () => {
    const recentMessages = Array(15).fill({
      date: DateTime.now().minus({ days: 1 }).toSeconds(),
      text: 'recent message'
    });
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: recentMessages
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should not trigger if dream-related topics were recently discussed', () => {
    const recentMessages = Array(5).fill({
      date: DateTime.now().minus({ days: 1 }).toSeconds(),
      text: 'we talked about dreams yesterday'
    });
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: recentMessages
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should trigger when all conditions are met and random chance succeeds', () => {
    // Mock Math.random to return 0.2 (less than 0.3 threshold)
    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    const recentMessages = Array(5).fill({
      date: DateTime.now().minus({ days: 1 }).toSeconds(),
      text: 'normal conversation'
    });
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: recentMessages
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(true);
  });

  test('should not trigger when random chance fails', () => {
    // Mock Math.random to return 0.5 (greater than 0.3 threshold)
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const recentMessages = Array(5).fill({
      date: DateTime.now().minus({ days: 1 }).toSeconds(),
      text: 'normal conversation'
    });
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      state: {
        history: recentMessages
      }
    };
    expect(initiationTopicTrigger.condition(context)).toBe(false);
  });

  test('should enqueue message with correct content when triggered', async () => {
    const context = {
      request: {
        peerType: "user",
        isOutbox: false
      },
      vk: {},
      response: {}
    };

    await initiationTopicTrigger.action(context);

    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg.request).toEqual(context.request);
    expect(callArg.vk).toEqual(context.vk);
    expect(initiationTopicQuestions).toContain(callArg.response.message);
  });
});