const { wellBeingTrigger } = require('../triggers/well-being');
const { enqueueMessage } = require('../outgoing-messages');
jest.mock('../outgoing-messages');

const expectedOutgoingMessages = [
  'Хорошо',
  'Всё хорошо'
];
const expectedOutgoingMessagesRegex = new RegExp(expectedOutgoingMessages.join('|'), "i");

describe('wellBeingTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Как дела?'],
    ['Как жизнь?']
  ])('matches "%s" well being question and gives expected response', (incomingMessage) => {
    const context = { request: { text: incomingMessage } };
    expect(wellBeingTrigger.condition(context)).toBe(true);
    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(callArg.response.message).toMatch(expectedOutgoingMessagesRegex);
  });

  test.each([
    ['Чем занимаешься?'], 
    ['Какая цель добавления в друзья?']
  ])('does not match "%s" question', (incomingMessage) => {
    const context = { request: { text: incomingMessage } };
    expect(wellBeingTrigger.condition(context)).toBe(false);
    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});