const { getRandomElement } = require('./utils');
const { enqueueMessage } = require('../outgoing-messages');

const questionRegex = /^м*\?+$/ui;

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

const undefinedQuestionTrigger = {
  condition: (context) => {
    return questionRegex.test(context.request.text);
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
  undefinedQuestionTrigger
};