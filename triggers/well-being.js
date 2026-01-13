const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Matches Russian phrases: "Как дела?", "Как жизнь?", "Как поживаешь?"
// Matches English phrases: "How are you?", "How are you doing?", "How have you been?",
// "How's everything?", "How's it going?", "How are things going?", "What's going on?",
// "What's new?", "What's up?", "Whassup?", "What are you up to?"
const wellBeingQuestionRegex = /(как)[^\p{L}]+(поживаешь|дела|жизнь)|^[^\p{L}\?]*(how|what)\b[^\p{L}]+(are|is|have|'?s)\b[^\p{L}]+(you|everything|it|things|going|new|up|been)\b.*$|^.*\b(whassup)\b.*$/ui;

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