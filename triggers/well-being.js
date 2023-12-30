const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const wellBeingQuestionRegex = /^[^\p{L}\?]*Как[^\p{L}\?]*(дела|жизнь)[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const wellBeingAnswers = [
  "Хорошо",
  "Всё хорошо",
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
  wellBeingTrigger
};