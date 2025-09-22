const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Regex to match questions about GPT/ChatGPT usage
const gptQuestionRegex = /^[^\p{L}]*(ты|вы|используешь|используете|пользуешься|пользуетесь)[^\p{L}]*(ли)?[^\p{L}]*(ты|вы)?[^\p{L}]*(используешь|используете|пользуешься|пользуетесь)?[^\p{L}]*(GPT|ChatGPT|чат[^\p{L}]*GPT|джи[^\p{L}]*пи[^\p{L}]*ти|нейросетью|нейросетями|ИИ|AI|искусственным[^\p{L}]+интеллектом)[^\p{L}]*\??[^\p{L}]*$/ui;

const answers = [
  "Нет, я сам написан на JavaScript и работаю через VK API.",
  "Нет, я написан на обычном JavaScript, без использования нейросетей.",
  "Нет, я обычный бот на JavaScript, написанный Константином.",
  "Нет, я не использую GPT. Я написан на чистом JavaScript.",
  "Нет, я работаю без GPT и нейросетей, только на JavaScript.",
  "Нет, я простой бот на JavaScript, без всяких GPT.",
];

const trigger = {
  name: "GPTUsageTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && gptQuestionRegex.test(context.request.text);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(answers)
      }
    });
  }
};

module.exports = {
  trigger,
  answers
};