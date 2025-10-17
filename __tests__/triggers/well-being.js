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
    ['How are you'],
    ['How are you?'],
    ['How are you doing?'],
    ['How have you been?'],
    ['How\'s everything?'],
    ['How\'s it going?'],
    ['How are things going?'],
    ['What\'s going on?'],
    ['What\'s new?'],
    ['What\'s up?'],
    ['Whassup?'],
    ['What are you up to?'],
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