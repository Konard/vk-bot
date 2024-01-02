const { wellBeingTrigger, wellBeingAnswers } = require('../../triggers/well-being');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('wellBeingTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Как дела?'],
    ['Как жизнь?'],
    ['Как поживаешь?']
  ])('matches "%s" well being question and gives expected response', (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(wellBeingTrigger.condition(context)).toBe(true);
    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(wellBeingAnswers).toContain(callArg.response.message);
  });

  test.each([
    ['Чем занимаешься?'],
    ['Какая цель добавления в друзья?']
  ])('does not match "%s" question', (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(wellBeingTrigger.condition(context)).toBe(false);
    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});