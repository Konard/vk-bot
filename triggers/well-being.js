const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Как дела?
// Как жизнь?
const wellBeingQuestionRegex = /^\s*Как (дела|жизнь)[\s?)\\]*$/ui;

const wellBeingAnswers = [
  "Хорошо",
  "Всё хорошо",
];

const wellBeingTrigger = {
  name: "WellBeingTrigger",
  condition: (context) => {
    return wellBeingQuestionRegex.test(context.request.text);
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