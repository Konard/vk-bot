const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

const questionRegex = /^[^\p{L}\?]*м*[^\p{L}\?]*[⁉️❔\?]+[^\p{L}]*$/ui;

const questionClarifications = [
  "Ответ на какой конкретный вопрос интересует?",
  "Что является предметом вопроса?",
  "О каком вопросе идет речь?",
  "Какой вопрос подразумевается?",
  "Что конкретно интересует?",
  "В чём вопрос?",
  "В чём суть вопроса?",
  "Чего касается заданный вопрос?",
  "С чем связан вопрос?",
  "С чем связан заданный вопрос?"
];

const trigger = {
  name: "UndefinedQuestionTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }

    if (context?.state?.history) {
      const history = context?.state?.history;
      if (history) {
        console.log(JSON.stringify(history, null, 2));

        const isLastMessageOutgoing = history[0]?.out;
        const isPreviousMessageOutgoing = history[1]?.out;

        console.log({ isLastMessageOutgoing, isPreviousMessageOutgoing });

        if (isLastMessageOutgoing) {
          return false;
        }
        if (!isPreviousMessageOutgoing) {
          return false;
        }
      }
    }

    return !context?.request?.isOutbox
        && questionRegex.test(context.request.text);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(questionClarifications)
      }
    });
  }
};

module.exports = {
  trigger,
  questionClarifications
};