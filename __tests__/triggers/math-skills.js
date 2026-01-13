const { trigger: mathSkillsTrigger, answers: mathSkillsAnswers } = require('../../triggers/math-skills');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'math skills trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Как ты разбираешься в математике?'],
    ['Как хорошо ты знаешь математику?'],
    ['Насколько хорошо ты умеешь считать?'],
    ['Ты хорошо разбираешься в алгебре?'],
    ['Как ты знаешь геометрию?'],
    ['Умеешь ли ты математику'],
    ['Как дела с математикой?'],
    ['Как ты с арифметикой?'],
    ['Хорошо ли ты разбираешься в матеме?'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(mathSkillsTrigger.condition(context)).toBe(true);
    if (mathSkillsTrigger.condition(context)) {
      mathSkillsTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(mathSkillsAnswers).toContain(callArg.response.message);
  });

  test.each([
    ['Как дела?'],
    ['Что делаешь?'],
    ['Привет'],
    ['Как жизнь?'],
    ['Какая цель добавления в друзья?'],
    ['Любишь ли ты спорт?'],
  ])(`"%s" does not match ${triggerDescription}`, (incomingMessage) => {
    const context = { request: { isOutbox: false, text: incomingMessage } };
    expect(mathSkillsTrigger.condition(context)).toBe(false);
    if (mathSkillsTrigger.condition(context)) {
      mathSkillsTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});