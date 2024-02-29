const { hasSticker, getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { stickers } = require('../stickers');

// TODO: СПАСИБО КОНСТАНТИН!!!!
const gratitudeRegex = /^[^\p{L}]*(благодарю|(огромное|большое[^\p{L}]*)?спасибо([^\p{L}]*(огромное|большое))?)[^\p{L}]*$/ui;

const incomingGratitudeStickersIds = [
  6342,
  66407, // СПАСИБО
  stickers["oni-chan"].gratitute.id,
];

const outgoingGratitudeResponseStickerId = 60075;

const gratitudeTrigger = {
  name: "GratitudeTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
        && (
            gratitudeRegex.test(context.request.text)
        ||  hasSticker(context.request, incomingGratitudeStickersIds)
        );
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        sticker_id: outgoingGratitudeResponseStickerId,
      }
    });
  }
};

module.exports = {
  gratitudeTrigger,
  outgoingGratitudeResponseStickerId
};