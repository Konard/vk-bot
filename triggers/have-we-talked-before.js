const { getRandomElement, hasSticker } = require('../utils');
const { greetingRegex, commonGreetingStickersIds } = require('./greeting');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const questions = [
  "Мы общались ранее?"
];

const trigger = {
  name: "HaveWeTalkedBeforeTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    const trigger = false;
    if (context?.state?.history) {
      const history = context?.state?.history;
      if (history && history.length == 2) {
        console.log(JSON.stringify(history, null, 2));

        const firstMessage = history[0]?.text;
        const secondMessage = history[1]?.text;
  
        console.log({ firstMessage, secondMessage });

        const firstGreetingSticker = hasSticker(history[0], commonGreetingStickersIds);
        const secondGreetingSticker = hasSticker(history[1], commonGreetingStickersIds);

        console.log({ firstGreetingSticker, secondGreetingSticker });
  
        if ((firstGreetingSticker || greetingRegex.test(firstMessage)) && (secondGreetingSticker || greetingRegex.test(secondMessage))) {
          trigger = true;
        }
      }
    }
    return trigger;
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(questions)
      }
    });
  }
};

module.exports = {
  trigger,
  questions
};