const { gratitudeTrigger, outgoingGratitudeResponseStickerId } = require('../../triggers/gratitude');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('gratitudeTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Благодарю! 🙏♥🙏'],
    ['🙂Спасибо!'],
    ['Спасибо большое!'],
    ['Спасибо'],
  ])('matches "%s" greeting trigger and gives expected response', (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(gratitudeTrigger.condition(context)).toBe(true);
    if (gratitudeTrigger.condition(context)) {
      gratitudeTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(callArg.response.sticker_id).toEqual(outgoingGratitudeResponseStickerId);
  });

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(gratitudeTrigger.condition(context)).toBe(false);
  //   if (gratitudeTrigger.condition(context)) {
  //     gratitudeTrigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});