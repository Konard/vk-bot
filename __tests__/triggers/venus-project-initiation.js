const { trigger: venusProjectTrigger, questions } = require('../../triggers/venus-project-initiation');
const { enqueueMessage } = require('../../outgoing-messages');

jest.mock('../../outgoing-messages');

const triggerDescription = 'venus project initiation trigger';

describe('venus project initiation trigger', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    'что делаешь?',
    'чем занимаешься?',
    'что нового?',
    'расскажи о себе',
    'о чём поговорим?',
    'что интересного?',
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = {
      request: {
        isFromUser: true,
        isOutbox: false,
        text: incomingMessage
      },
      state: {
        history: [
          { text: incomingMessage, out: 0 },
          { text: 'привет!', out: 1 },
          { text: 'привет', out: 0 }
        ],
        triggers: {}
      }
    };

    expect(venusProjectTrigger.condition(context)).toBe(true);
    if (venusProjectTrigger.condition(context)) {
      venusProjectTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(questions).toContain(callArg.response.message);
  });

  test('outgoing message should not trigger', () => {
    const context = {
      request: {
        isFromUser: true,
        isOutbox: true,
        text: 'что делаешь?'
      },
      state: {
        history: [
          { text: 'что делаешь?', out: 1 },
          { text: 'привет!', out: 0 },
          { text: 'привет', out: 1 }
        ],
        triggers: {}
      }
    };

    expect(venusProjectTrigger.condition(context)).toBe(false);
  });

  test('long conversation should not trigger', () => {
    const context = {
      request: {
        isFromUser: true,
        isOutbox: false,
        text: 'что делаешь?'
      },
      state: {
        history: Array.from({ length: 10 }, (_, i) => ({
          text: `message ${i}`,
          out: i % 2
        })),
        triggers: {}
      }
    };

    expect(venusProjectTrigger.condition(context)).toBe(false);
  });

  test('recently triggered should not trigger again', () => {
    const context = {
      request: {
        isFromUser: true,
        isOutbox: false,
        text: 'что делаешь?'
      },
      state: {
        history: [
          { text: 'что делаешь?', out: 0 },
          { text: 'привет!', out: 1 },
          { text: 'привет', out: 0 }
        ],
        triggers: {
          [venusProjectTrigger.name]: {
            lastTriggered: new Date().toISOString()
          }
        }
      }
    };

    expect(venusProjectTrigger.condition(context)).toBe(false);
  });

  test('should mark trigger as activated after action', () => {
    const context = {
      request: {
        isFromUser: true,
        isOutbox: false,
        text: 'что делаешь?'
      },
      state: {
        history: [
          { text: 'что делаешь?', out: 0 },
          { text: 'привет!', out: 1 },
          { text: 'привет', out: 0 }
        ],
        triggers: {}
      }
    };

    venusProjectTrigger.action(context);
    expect(context.state.triggers[venusProjectTrigger.name].lastTriggered).toBeDefined();
  });
});