const { greetingTrigger, outgoingGreetingStickersIds } = require('../../triggers/greeting');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('greetingTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Здравствуйте'],
    ['Привет'],
    ['Приветик'],
    ['Приветики тебе!'],
  ])('matches "%s" greeting trigger and gives expected response', (incomingMessage) => {
    const context = { request: { text: incomingMessage } };
    expect(greetingTrigger.condition(context)).toBe(true);
    if (greetingTrigger.condition(context)) {
      greetingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(outgoingGreetingStickersIds).toContain(callArg.response.sticker_id);
  });

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(greetingTrigger.condition(context)).toBe(false);
  //   if (greetingTrigger.condition(context)) {
  //     greetingTrigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});