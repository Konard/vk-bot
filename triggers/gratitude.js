const { hasSticker, getRandomElement } = require('./utils');
const { enqueueMessage } = require('../outgoing-messages');
const { stickers } = require('../stickers');

// TODO: СПАСИБО КОНСТАНТИН!!!!
// Благодарю! 🙏♥🙏
// 🙂Спасибо!
// Спасибо большое!
const gratitudeRegex = /^[\s🙂]*(благодарю|(огромное|большое\s*)?спасибо(\s*(огромное|большое))?)[\s)\\♥.!☺😊👍✅🙏🤝]*$/ui;

const incomingGratitudeStickersIds = [
  6342,
  stickers["oni-chan"].gratitute.id,
];

const outgoingGratitudeResponseStickerId = 60075;

const gratitudeTrigger = {
  condition: (context) => {
    return gratitudeRegex.test(context.request.text) || hasSticker(context.request, incomingGratitudeStickersIds);
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
  gratitudeTrigger
};