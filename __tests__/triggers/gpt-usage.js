const { trigger: gptUsageTrigger, answers: gptUsageAnswers } = require('../../triggers/gpt-usage');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'GPT usage trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Ты используешь GPT?'],
    ['Вы используете ChatGPT?'],
    ['Ты пользуешься нейросетью?'],
    ['Используешь ли ты джи пи ти?'],
    ['Ты используешь ИИ?'],
    ['Вы пользуетесь искусственным интеллектом?'],
    ['Ты используешь чат GPT?'],
    ['Пользуешься нейросетями?'],
    ['Используете AI?'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(gptUsageTrigger.condition(context)).toBe(true);
    if (gptUsageTrigger.condition(context)) {
      gptUsageTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(gptUsageAnswers).toContain(callArg.response.message);
  });

  test.each([
    ['Как дела?'],
    ['Что умеешь?'],
    ['Привет!'],
    ['Кто ты?'],
    ['GPT это круто'],
    ['Я использую ChatGPT']
  ])(`"%s" does not match ${triggerDescription}`, (incomingMessage) => {
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(gptUsageTrigger.condition(context)).toBe(false);
    if (gptUsageTrigger.condition(context)) {
      gptUsageTrigger.action(context);
    }
    expect(enqueueMessage).not.toHaveBeenCalled();
  });
});