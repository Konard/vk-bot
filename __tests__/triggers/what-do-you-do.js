const { trigger: whatDoYouDoTrigger, answers: whatDoYouDoAnswers } = require('../../triggers/what-do-you-do');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'what do you do trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Что делаешь'],
    ['Что делаешь?'],
    ['Чем занимаешься?'],
    ['Чем занят?'],
    ['Чем занят'],
    ['что делаешь'],
    ['чем занимаешься'],
    ['чем занят'],
    ['Что делаешь сейчас?'],
    ['😊 что делаешь?'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(whatDoYouDoTrigger.condition(context)).toBe(true);
    if (whatDoYouDoTrigger.condition(context)) {
      whatDoYouDoTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(whatDoYouDoAnswers).toContain(callArg.response.message);
  });

  test.each([
    ['Как дела?'],
    ['Что такое программирование?'],
    ['Кто ты?'],
    ['Привет'],
    ['Как жизнь?'],
    ['Что нового?'],
    ['Что за дела?'],
    ['А чем занимаешься?']
  ])(`"%s" does not match ${triggerDescription}`, (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(whatDoYouDoTrigger.condition(context)).toBe(false);
    if (whatDoYouDoTrigger.condition(context)) {
      whatDoYouDoTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});