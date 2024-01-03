const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Кто вы?
const questionRegex = /^[^\p{L}\?]*кто[^\p{L}\?]*вы[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const answers = [
  "Я программист, а вы?",
];

const trigger = {
  name: "WhoMultipleTrigger",
  condition: (context) => {
    return !context?.request?.isOutbox
        && questionRegex.test(context.request.text);
  },
  action: (context) => {
    if (context?.state) {
      context.state.peerPrefersDistance = true;
    }
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