const { getRandomElement, hasSticker } = require('../utils');
const { greetingRegex, incomingGreetingStickersIds } = require('./greeting');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const questions = [
  "Мы общались ранее?"
];

const trigger = {
  name: "HaveWeTalkedBeforeTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) { // not community
      return false;
    }
    let trigger = false;
    if (context?.state?.history) {
      const history = context?.state?.history;
      if (history && history.length == 2) {
        console.log(JSON.stringify(history, null, 2));

        const isLastMessageOutgoing = history[0]?.out;
        const isPreviousMessageOutgoing = history[1]?.out;

        console.log({ isLastMessageOutgoing, isPreviousMessageOutgoing });

        const lastMessage = history[0]?.text;
        const previousMessage = history[1]?.text;
  
        console.log({ lastMessage, previousMessage });

        const lastGreetingSticker = hasSticker(history[0], incomingGreetingStickersIds);
        const previousGreetingSticker = hasSticker(history[1], incomingGreetingStickersIds);

        console.log({ lastGreetingSticker, previousGreetingSticker });
  
        if ((isLastMessageOutgoing === 0 && (lastGreetingSticker || greetingRegex.test(lastMessage))) && (isPreviousMessageOutgoing === 1 && (previousGreetingSticker || greetingRegex.test(previousMessage)))) {
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