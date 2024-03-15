const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const wellBeingQuestionRegex = /^[^\p{L}\?]*(как)[^\p{L}\?]*(поживаешь|дела|жизнь)[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const answers = [
  "Хорошо, программирую.",
  "Хорошо, программированием занимаюсь.",
  "Всё хорошо, программирую.",
  "Всё хорошо, программированием занимаюсь.",
  "Хорошо, автоматизирую.",
  "Хорошо, автоматизацией занимаюсь.",
  "Всё хорошо, автоматизирую.",
  "Всё хорошо, автоматизацией занимаюсь.",
];

const trigger = {
  name: "WellBeingTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && wellBeingQuestionRegex.test(context.request.text);
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