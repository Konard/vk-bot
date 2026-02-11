const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Regex to match various forms of "Are you a programmer?" in Russian and English
const programmerQuestionRegex = /^[^\p{L}\?]*(ты[^\p{L}\?]*(есть|являешься)?[^\p{L}\?]*программист(ом)?|программист[^\p{L}\?]*ли[^\p{L}\?]*ты|are[^\p{L}\?]*you[^\p{L}\?]*a?[^\p{L}\?]*programmer|you[^\p{L}\?]*are[^\p{L}\?]*programmer)[^\p{L}\?]*\?*[^\p{L}]*$/ui;

const answers = [
  "Да, я программист! А ты?",
  "Да, программирую! А ты чем занимаешься?",
  "Да, я программист. А что делаешь ты?",
  "Программист, да! А ты?",
  "Да, программированием занимаюсь. А ты?",
  "Да, я программист :) А ты кто?",
  "Программист! А ты программируешь?",
  "Да, программист. А ты в этой сфере?",
];

const trigger = {
  name: "AreYouProgrammerTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && programmerQuestionRegex.test(context.request.text);
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
  answers,
  programmerQuestionRegex
};