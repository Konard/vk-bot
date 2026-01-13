const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const whatDoYouDoRegex = /^[^\p{L}\?]*(что[^\p{L}]*делаешь|чем[^\p{L}]*(занимаешься|занят))/ui;

const answers = [
  "Программирую.",
  "Программированием занимаюсь.",
  "Автоматизирую.",
  "Автоматизацией занимаюсь.",
  "Кодом занимаюсь.",
  "Разработкой занимаюсь.",
  "Работаю над кодом.",
  "Пишу код.",
  "Разрабатываю программы.",
  "Занимаюсь разработкой."
];

const trigger = {
  name: "WhatDoYouDoTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && whatDoYouDoRegex.test(context.request.text);
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