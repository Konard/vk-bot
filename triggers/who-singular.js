const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const questionRegex = /^[^\p{L}\?]*(а)?[^\p{L}\?]*(кто[^\p{L}\?]*ты|ты[^\p{L}\?]*кто)[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const answers = [
  "Я программист, а ты?",
];

const trigger = {
  name: "WhoSingularTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && questionRegex.test(context.request.text);
  },
  action: (context) => {
    if (context?.state) {
      context.state.peerPrefersDistance = false;
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