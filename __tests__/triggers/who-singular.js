const { trigger, answers } = require('../../triggers/who-singular');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'who-singular trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Кто ты?'],
    ['Ты кто?'],
    ['А ты кто ?'],
  ])(`matches "%s" ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(trigger.condition(context)).toBe(true);
    if (trigger.condition(context)) {
      trigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(answers).toContain(callArg.response.message);
  });

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(trigger.condition(context)).toBe(false);
  //   if (trigger.condition(context)) {
  //     trigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});