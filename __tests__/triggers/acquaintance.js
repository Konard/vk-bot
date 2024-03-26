const { trigger: acquaintanceTrigger, acquaintanceSuggestions } = require('../../triggers/acquaintance');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('acquaintanceTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Мы знакомы?'],
    ['Мы знакомы с тобой?'],
  ])('matches "%s" greeting trigger and gives expected response', (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(acquaintanceTrigger.condition(context)).toBe(true);
    if (acquaintanceTrigger.condition(context)) {
      acquaintanceTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(acquaintanceSuggestions).toContain(callArg.response.message);
  });

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(acquaintanceTrigger.condition(context)).toBe(false);
  //   if (acquaintanceTrigger.condition(context)) {
  //     acquaintanceTrigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});