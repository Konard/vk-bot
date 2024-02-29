const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const goalQuestionRegex = /^[^\p{L}\?]*[вт]ы[^\p{L}\?]*что-то[^\p{L}\?]*хотели?[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const goalAnswers = [
  "Да, предложить дружбу.",
];

const goalTrigger = {
  name: "GoalTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && goalQuestionRegex.test(context.request.text);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(goalAnswers)
      }
    });
  }
};

module.exports = {
  goalTrigger,
  goalAnswers
};