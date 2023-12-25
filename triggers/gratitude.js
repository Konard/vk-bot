const { hasSticker, getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { stickers } = require('../stickers');

// TODO: СПАСИБО КОНСТАНТИН!!!!
const gratitudeRegex = /^[\s🙂]*(благодарю|(огромное|большое\s*)?спасибо(\s*(огромное|большое))?)[\s)\\♥.!☺😊👍✅🙏🤝]*$/ui;

const incomingGratitudeStickersIds = [
  6342,
  66407, // СПАСИБО
  stickers["oni-chan"].gratitute.id,
];

const outgoingGratitudeResponseStickerId = 60075;

const gratitudeTrigger = {
  name: "GratitudeTrigger",
  condition: (context) => {
    return !context.request.isOutbox
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