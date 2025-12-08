const { trigger: friendshipMeaningTrigger, friendshipMeaningAnswers } = require('../../triggers/friendship-meaning');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'friendship meaning trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Что для тебя значит дружба?'],
    ['Что такое дружба?'],
    ['Что дружба означает?'],
    ['Как ты понимаешь дружбу?'],
    ['Что для вас означает дружба?'],
    ['What does friendship mean?'],
    ['What is friendship?'],
    ['дружба что это?'],
    ['дружба что значит?'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = {
      request: { isFromUser: true, isOutbox: false, text: incomingMessage },
      state: { triggers: {} }
    };
    expect(friendshipMeaningTrigger.condition(context)).toBe(true);
    if (friendshipMeaningTrigger.condition(context)) {
      friendshipMeaningTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(friendshipMeaningAnswers).toContain(callArg.response.message);
  });

  test.each([
    ['Как дела?'],
    ['Привет!'],
    ['Что делаешь?'],
    ['Хочешь дружить?'],
    ['Будем друзьями?']
  ])(`"%s" does not match ${triggerDescription}`, (incomingMessage) => {
    const context = {
      request: { isFromUser: true, isOutbox: false, text: incomingMessage },
      state: { triggers: {} }
    };
    expect(friendshipMeaningTrigger.condition(context)).toBe(false);
    if (friendshipMeaningTrigger.condition(context)) {
      friendshipMeaningTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});