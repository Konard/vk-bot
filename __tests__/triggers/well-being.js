const { trigger: wellBeingTrigger, answers: wellBeingAnswers } = require('../../triggers/well-being');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'well being trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Как дела?'],
    ['Как жизнь?'],
    ['Как поживаешь?'],
    ['Как дела'],
    ['Привет как дела😏😏'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
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
  ])(`"%s" does not match ${triggerDescription}`, (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(wellBeingTrigger.condition(context)).toBe(false);
    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});