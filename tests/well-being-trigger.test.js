const { wellBeingTrigger } = require('../triggers/well-being');
const { enqueueMessage } = require('../outgoing-messages');
jest.mock('../outgoing-messages');

describe('wellBeingTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  it('matches well being question and gives a response', () => {
    const context = { request: { text: 'Как жизнь?' } };

    expect(wellBeingTrigger.condition(context)).toBe(true);

    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }

    expect(enqueueMessage).toHaveBeenCalled();

    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(callArg.response.message).toMatch(/Хорошо|Всё хорошо/);
  });
  it('does not match non well being question', () => {
    const context = { request: { text: 'Чем занимаешься?' } };

    expect(wellBeingTrigger.condition(context)).toBe(false);
    
    if (wellBeingTrigger.condition(context)) {
      wellBeingTrigger.action(context);
    }

    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});