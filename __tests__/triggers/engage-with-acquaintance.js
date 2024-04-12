const { trigger: engageWithAcquaintance, okStickerIds, questions } = require('../../triggers/engage-with-acquaintance');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'engage with acquaintance trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Нет'],
    ['Нет вроде'],
    ['Не'],
    ['Не вроде'],
    ['Вроде нет'],
    ['неа'],
    ['Не помню'],
    ['Вряд ли'],
    ['Не думаю'],
    ['Думаю нет )'],
    ['Нет,мы не общались.'],
    ['Да вроде нет'],
    ['Не знаю'],
    ['Вроде бы нет'],
    ['Нет, наверное'],
    ['Не припомню'],
    ['Не помню.'],
    ['Нет наверное'],
    ['Да вроде нет переписки'],
    ['По-моему нет'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { 
      request: { 
        isFromUser: true,
        isOutbox: false,
        text: incomingMessage
      },
      state: {
        history: [
          { text: incomingMessage },
          { text: 'Мы общались ранее?' },
        ]
      },
    };
    expect(engageWithAcquaintance.condition(context)).toBe(true);
    if (engageWithAcquaintance.condition(context)) {
      engageWithAcquaintance.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg1 = enqueueMessage.mock.calls[0][0];
    expect(callArg1).toEqual(expect.objectContaining(context));
    expect(okStickerIds).toContain(callArg1.response.sticker_id);
    const callArg2 = enqueueMessage.mock.calls[1][0];
    expect(callArg2).toEqual(expect.objectContaining(context));
    expect(questions).toContain(callArg2.response.message);
  });
});