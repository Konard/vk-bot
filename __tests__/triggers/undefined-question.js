const { trigger: undefinedQuestionTrigger, questionClarifications } = require('../../triggers/undefined-question');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'undefined question trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['?'],
    ['??'],
    ['м?'],
    ['мм?'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
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
});