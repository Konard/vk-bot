const { hasSticker, getRandomElement } = require('./utils');
const { enqueueMessage } = require('../outgoing-messages');

const greetingRegex = /^\s*(салам|з?д[ао]ров[ао]?|ку|qq|шалом|хай|йоу?|привет(ствую)?|здравствуй(те)?|дд|добр(ый\s*(день|вечер)|ое\s*утро|ой\s*ночи|ого\s*времени\s*суток))[\s.?!]*$/ui;

const commonGreetingStickersIds = [
  72789,
  3003,
  76459,
  73071,
  51417,
  72437,
  69175,
  4639,
  14409,
  21,
  75306,
  73151,
  77664,
  60062,
  134,
  4917,
  15346,
  79160,
  73601,
];

const incomingGreetingStickersIds = [
  ...commonGreetingStickersIds,
  53610,
  3462,
  58052,
  85099,
  20341,
  3952,
  87057,
  8472,
  7878,
  60272,
  94193,
  4323, // ПРИВЕТ
  85791, // ПРИВЕТ ПРИВЕТ
  86510, // САЛЮТ
  91176, // ПРИВЕТ
  68335, // CiAO
  84541, // Бонжур
  64785, // ПРИВЕТ
  84235, // ПРИВЕТ
  84236, // ХЕЛЛОУ
];

const outgoingGreetingStickersIds = [
  ...commonGreetingStickersIds,
];

const greetingTrigger = {
  condition: (context) => {
    return greetingRegex.test(context.request.text) || hasSticker(context.request, incomingGreetingStickersIds);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        sticker_id: getRandomElement(outgoingGreetingStickersIds)
      }
    });
  }
};

module.exports = {
  greetingTrigger
};