const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const wellBeingQuestionRegex = /^[^\p{L}\?]*(как)[^\p{L}\?]*(поживаешь|дела|жизнь)[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const wellBeingAnswers = [
  "Хорошо, программирую.",
  "Хорошо, программированием занимаюсь.",
  "Всё хорошо, программирую.",
  "Всё хорошо, программированием занимаюсь.",
  "Хорошо, автоматизирую.",
  "Хорошо, автоматизацией занимаюсь.",
  "Всё хорошо, автоматизирую.",
  "Всё хорошо, автоматизацией занимаюсь.",
];

const wellBeingTrigger = {
  name: "WellBeingTrigger",
  condition: (context) => {
    return !context?.request?.isOutbox
        && wellBeingQuestionRegex.test(context.request.text);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(wellBeingAnswers)
      }
    });
  }
};

module.exports = {
  wellBeingTrigger,
  wellBeingAnswers
};