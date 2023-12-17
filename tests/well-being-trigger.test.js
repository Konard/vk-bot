const { wellBeingTrigger } = require('../triggers/well-being');
const { enqueueMessage } = require('../outgoing-messages');
jest.mock('../outgoing-messages');

describe('wellBeingTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });
  it('matches well being question and gives expected response', () => {
    const incommingMessages = [
      'Как дела?',
      'Как жизнь?',
    ];
    const outgoingMessages = [
      'Хорошо',
      'Всё хорошо'
    ];
    const outgoingMessagesRegex = new RegExp(outgoingMessages.join('|'), "i");
    let c = 0;
    for (const message of incommingMessages) {
      const context = { request: { text: message } };
      expect(wellBeingTrigger.condition(context)).toBe(true);
      if (wellBeingTrigger.condition(context)) {
        wellBeingTrigger.action(context);
      }
      expect(enqueueMessage).toHaveBeenCalled();
      const callArg = enqueueMessage.mock.calls[c++][0];
      expect(callArg).toEqual(expect.objectContaining(context));
      expect(callArg.response.message).toMatch(outgoingMessagesRegex);
    }
  });
  it('does not match other questions', () => {
    const incommingMessages = [
      'Чем занимаешься?',
      'Какая цель добавления в друзья?',
    ];
    for (const message of incommingMessages) {
      const context = { request: { text: message } };
      expect(wellBeingTrigger.condition(context)).toBe(false);
      if (wellBeingTrigger.condition(context)) {
        wellBeingTrigger.action(context);
      }
      expect(enqueueMessage).not.toHaveBeenCalled();
    }
  });
});