const { hasSticker, getRandomElement } = require('./utils');
const { enqueueMessage } = require('../outgoing-messages');

// TODO: СПАСИБО КОНСТАНТИН!!!!
// Благодарю! 🙏♥🙏
const gratitudeRegex = /^\s*(благодарю|(большое\s*)?спасибо(\s*огромное)?)[\s)\\♥.!☺😊👍✅🙏🤝]*$/ui;

const incomingGratitudeStickersIds = [
  6342,
]

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