const { trigger: greetingTrigger, outgoingGreetingStickersIds } = require('../../triggers/greeting');
const { enqueueMessage } = require('../../outgoing-messages');
const { getOrLoadMessages } = require('../../messages-cache');
const { DateTime } = require('luxon');

jest.mock('../../outgoing-messages');
jest.mock('../../messages-cache');

const triggerDescription = 'greeting trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
    getOrLoadMessages.mockClear();
  });

  test.each([
    ['Здравствуйте'],
    ['Привет'],
    ['Приветик'],
    ['Приветики тебе!'],
    ['Здрасте'],
    ['Здрасьте'],
    ['Здравсте'],
    ['День добрый'],
    ['Здравствуйте!'],
    ['Мои приветствия!'],
    ['🖐'],
    ['👋'],
    ['🖖'],
    ['👋👍😊'],
    ['Привет!👋'],
    ['Константин, приветствую 👋'],
    ['Трям🖖'],
    ['Салют'],
    ['Приветствую!'],
    ['Привет Привет 🤝🤝🤝'],
    ['хай!'],
    ['Хэллоу'],
  ])(`"%s" message matches ${triggerDescription} and gives expected response`, async (incomingMessage) => {
    // Mock messages showing this is the first message in 24+ hours
    const now = DateTime.now();
    const oldMessage = {
      id: 123,
      date: now.minus({ hours: 25 }).toSeconds() // 25 hours ago
    };
    getOrLoadMessages.mockResolvedValue([oldMessage]);

    const context = {
      request: {
        peerType: 'user',
        isFromUser: true,
        text: incomingMessage,
        user_id: 456,
        id: 789
      },
      state: { triggers: {} }
    };

    expect(await greetingTrigger.condition(context)).toBe(true);
    if (await greetingTrigger.condition(context)) {
      await greetingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(outgoingGreetingStickersIds).toContain(callArg.response.sticker_id);
  });

  test.each([
    [16029], // ПРИВЕТИКИ
    [85081], // ХАЙ, БИЧ
    [58732], // О! ПРИВЕТ!
    [18035], // ПРИВЕТ!
    [88693], // ЗДРЫ
    [86108], // ПРИВЕТ
    [81987], 
    [59666], // ПРИВЕТИК
    [80788], // КУ
    [72459], 
    [90653], 
    [8695],  // ЗДРАСЬТЕ
    [62694], // ПРИВЕТ!
    [17722], // БОНЖУР
    [12115], // ПРИВЕТИКИ
    [53098], // НУ ПРИВЕТ
    [73601], 
    [81248], // ДОБРЫЙ ВЕЧЕР
    [56896], // ПРИВЕТ
    [76436], // АЛОХА!
    [73705], // ПРИВЕТ
    [74558], 
    [62800], // КУ
    [72168], // ПРИВЕТ, ЗАЙ
    [11510], 
    [66363], 
    [4501],  // ПРИВЕТ!
    [98390], // 
    [51259], // ПРИВЕТ
    [66087], // ПРИВЕТИК
    [65253], // ПРИВЕТ
    [63426], // ДАРОВА
    [61829], // ПРИВЕТИК!
    [70784], // ПРИВ
    [74108], // ЗДРАВСТВУЙТЕ
    [84592], // ПРИВЕТ, ДРУГ
    [8481],  // 
    [89004], // 
    [57279], // ПРИВЕТ
    [92708], // ПРИВЕТ
    [17952], // СӘЛЕМ
    [50644], // ПРИВЕТ!
    [83820], // П-ПРИВЕТ!
    [9469],  // ХАЙ
    [79394], // ДАРОВА
    [54474], // БОНЖУР!
  ])(`"%s" sticker matches ${triggerDescription} and gives expected response`, async (incomingStickerId) => {
    // Mock messages showing this is the first message in 24+ hours
    const now = DateTime.now();
    const oldMessage = {
      id: 123,
      date: now.minus({ hours: 25 }).toSeconds() // 25 hours ago
    };
    getOrLoadMessages.mockResolvedValue([oldMessage]);

    const context = {
      request: {
        peerType: 'user',
        isFromUser: true,
        attachments: [{ id: incomingStickerId }],
        user_id: 456,
        id: 789
      },
      state: { triggers: {} }
    };

    expect(await greetingTrigger.condition(context)).toBe(true);
    if (await greetingTrigger.condition(context)) {
      await greetingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(outgoingGreetingStickersIds).toContain(callArg.response.sticker_id);
  });

  test('should NOT treat greeting text as greeting when last message was recent', async () => {
    // Mock messages showing recent activity (less than 24 hours)
    const now = DateTime.now();
    const recentMessage = {
      id: 123,
      date: now.minus({ hours: 5 }).toSeconds() // 5 hours ago
    };
    getOrLoadMessages.mockResolvedValue([recentMessage]);

    const context = {
      request: {
        peerType: 'user',
        isFromUser: true,
        text: 'Привет',
        user_id: 456,
        id: 789
      },
      state: { triggers: {} }
    };

    expect(await greetingTrigger.condition(context)).toBe(false);
    expect(enqueueMessage).not.toHaveBeenCalled();
  });

  test('should treat greeting text as greeting when it is first message ever', async () => {
    // Mock empty message history
    getOrLoadMessages.mockResolvedValue([]);

    const context = {
      request: {
        peerType: 'user',
        isFromUser: true,
        text: 'Привет',
        user_id: 456,
        id: 789
      },
      state: { triggers: {} }
    };

    expect(await greetingTrigger.condition(context)).toBe(true);
  });

  test('should NOT trigger when already triggered within 24 hours', async () => {
    // Mock old message history (25+ hours ago)
    const now = DateTime.now();
    const oldMessage = {
      id: 123,
      date: now.minus({ hours: 25 }).toSeconds()
    };
    getOrLoadMessages.mockResolvedValue([oldMessage]);

    const context = {
      request: {
        peerType: 'user',
        isFromUser: true,
        text: 'Привет',
        user_id: 456,
        id: 789
      },
      state: {
        triggers: {
          GreetingTrigger: {
            lastTriggered: now.minus({ hours: 12 }) // Triggered 12 hours ago
          }
        }
      }
    };

    expect(await greetingTrigger.condition(context)).toBe(false);
  });
});