const { getRandomElement, hasSticker } = require('../utils');
const { greetingRegex, incomingGreetingStickersIds } = require('./greeting');
const { questions: haveWeTalkedBeforeQuestions } = require('./have-we-talked-before')
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const questions = [
  "Я твой друг-программист, а ты? ;)",
  "Я твой друг-программист, а ты? :)",
  "Я твой друг-программист, а ты?"
];

const okStickerIds = [
  59431
];

const noRegex = /^[^\p{L}]*(((да[^\p{L}]+)?(вроде([^\p{L}]+бы)?|думаю|по-моему)[^\p{L}]+)?(не[та]?|вряд[^\p{L}]+ли)([^\p{L}]+(переписки|вроде|(при)?помню|думаю|знаю|наверное?|(мы[^\p{L}]+)?не[^\p{L}]+общались))?)[^\p{L}]*$/ui;

const trigger = {
  name: "EngageWithAcquaintance",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    let trigger = false;
    if (context?.state?.history) {
      const history = context?.state?.history;
      if (history && history.length >= 2) {
        // console.log(JSON.stringify(history, null, 2));

        const firstMessage = history[0]?.text;
        const secondMessage = history[1]?.text;
  
        // console.log({ firstMessage, secondMessage });

        // const firstGreetingSticker = hasSticker(history[0], incomingGreetingStickersIds);
        // const secondGreetingSticker = hasSticker(history[1], incomingGreetingStickersIds);

        // console.log({ firstGreetingSticker, secondGreetingSticker });
  
        if (haveWeTalkedBeforeQuestions.includes(secondMessage) && noRegex.test(firstMessage)) {
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
        sticker_id: getRandomElement(okStickerIds),
      }
    });
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
  questions,
  okStickerIds
};