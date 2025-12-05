const { trigger: greetingAndAcquaintanceTrigger, combinedResponses, containsGreetingAndAcquaintance } = require('../../triggers/greeting-and-acquaintance');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'greeting and acquaintance trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Привет! Мы знакомы?'],
    ['Привет. Мы знакомы?'],
    ['Привет, мы знакомы с тобой?'],
    ['Приветик! Мы знакомы?'],
    ['Здравствуйте! Мы знакомы?'],
    ['🖐 Мы знакомы?'],
    ['👋 Мы знакомы с тобой?'],
    ['Мы знакомы? Привет!'],
    ['Знакомы мы? Привет'],
    ['Привет, знакомы мы?'],
    ['Салют! Мы знакомы?'],
    ['Хай! Мы знакомы с тобой?'],
  ])(`"%s" message matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage, attachments: [] } };
    expect(greetingAndAcquaintanceTrigger.condition(context)).toBe(true);
    if (greetingAndAcquaintanceTrigger.condition(context)) {
      greetingAndAcquaintanceTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(combinedResponses).toContain(callArg.response.message);
  });

  test.each([
    ['Привет'],
    ['Мы знакомы?'],
    ['Как дела?'],
    ['Здравствуйте, как у вас дела?'],
  ])(`"%s" message does not match ${triggerDescription} (missing greeting or acquaintance)`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage, attachments: [] } };
    expect(greetingAndAcquaintanceTrigger.condition(context)).toBe(false);
  });

  test('greeting sticker + acquaintance text matches trigger', () => {
    const context = {
      request: {
        isFromUser: true,
        isOutbox: false,
        text: 'Мы знакомы?',
        attachments: [{ id: 72789 }] // greeting sticker
      }
    };
    expect(greetingAndAcquaintanceTrigger.condition(context)).toBe(true);
  });

  test('containsGreetingAndAcquaintance function works correctly', () => {
    expect(containsGreetingAndAcquaintance('Привет! Мы знакомы?', [])).toBe(true);
    expect(containsGreetingAndAcquaintance('Привет', [])).toBe(false);
    expect(containsGreetingAndAcquaintance('Мы знакомы?', [])).toBe(false);
    expect(containsGreetingAndAcquaintance('Мы знакомы?', [{ id: 72789 }])).toBe(true);
  });
});
