const { trigger: areYouProgrammerTrigger, answers: areYouProgrammerAnswers } = require('../../triggers/are-you-programmer');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'are you programmer trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Ты программист?'],
    ['ты программист?'],
    ['Ты являешься программистом?'],
    ['Программист ли ты?'],
    ['Are you a programmer?'],
    ['are you programmer?'],
    ['Are you a programmer'],
    ['You are programmer?'],
    ['Ты есть программист?'],
    ['Ты программист ???'],
    [' ты программист ? '],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage }, state: {} };
    expect(areYouProgrammerTrigger.condition(context)).toBe(true);
    if (areYouProgrammerTrigger.condition(context)) {
      areYouProgrammerTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(areYouProgrammerAnswers).toContain(callArg.response.message);
  });

  test.each([
    ['Как дела?'],
    ['Кто ты?'],
    ['Чем занимаешься?'],
    ['Что программируешь?'],
    ['Hello'],
    ['Are you okay?'],
    ['Программист хороший'],
    ['Ты не программист']
  ])(`"%s" does not match ${triggerDescription}`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(areYouProgrammerTrigger.condition(context)).toBe(false);
    if (areYouProgrammerTrigger.condition(context)) {
      areYouProgrammerTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});