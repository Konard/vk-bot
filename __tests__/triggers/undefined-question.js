const { trigger: undefinedQuestionTrigger, questionClarifications } = require('../../triggers/undefined-question');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('undefinedQuestionTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['?'],
    ['??'],
    ['м?'],
    ['мм?'],
  ])('matches "%s" greeting trigger and gives expected response', (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(undefinedQuestionTrigger.condition(context)).toBe(true);
    if (undefinedQuestionTrigger.condition(context)) {
      undefinedQuestionTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(questionClarifications).toContain(callArg.response.message);
  });

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(undefinedQuestionTrigger.condition(context)).toBe(false);
  //   if (undefinedQuestionTrigger.condition(context)) {
  //     undefinedQuestionTrigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});