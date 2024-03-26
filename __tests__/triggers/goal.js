const { trigger: goalTrigger, goalAnswers } = require('../../triggers/goal');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('goalTrigger', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Вы что-то хотели?'],
    ['Ты что-то хотел?'],
  ])('matches "%s" greeting trigger and gives expected response', (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(goalTrigger.condition(context)).toBe(true);
    if (goalTrigger.condition(context)) {
      goalTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(goalAnswers).toContain(callArg.response.message);
  });

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(goalTrigger.condition(context)).toBe(false);
  //   if (goalTrigger.condition(context)) {
  //     goalTrigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});