const { hasSticker, getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const greetingRegex = /^[^\p{L}]*(салам|з?д[ао]ров[ао]?|ку|q+|шалом|хай|йоу?|привет(ствую|ики?)?|здравствуй(те)?|дд|добр(ый[^\p{L}]*(день|вечер)|ое[^\p{L}]*утро|ой[^\p{L}]*ночи|ого[^\p{L}]*времени[^\p{L}]*суток))([^\p{L}]*(тебе|вам))?[^\p{L}]*$/ui;

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
  70753,
];

const outgoingGreetingStickersIds = [
  ...commonGreetingStickersIds,
];

const trigger = {
  name: "GreetingTrigger",
  condition: (context) => {
    // console.log('context!!', context)
    // console.log('!context?.request?.isFromUser', !context?.request?.isFromUser)
    // if (!context?.request?.isFromUser) {
    //   return false;
    // }
    const now = DateTime.now();
    console.log('now', now);
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    console.log('lastTriggered', lastTriggered);
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;
    console.log('lastTriggeredDiff >= 1', lastTriggeredDiff >= 1)
    console.log('greetingRegex.test(context.request.text)', greetingRegex.test(context.request.text))
    console.log('hasSticker(context.request, incomingGreetingStickersIds)', hasSticker(context.request, incomingGreetingStickersIds))
    console.log(`lastTriggeredDiff >= 1
    && (
        greetingRegex.test(context.request.text)
    ||  hasSticker(context.request, incomingGreetingStickersIds)
    )`, lastTriggeredDiff >= 1
    && (
        greetingRegex.test(context.request.text)
    ||  hasSticker(context.request, incomingGreetingStickersIds)
    ))
    return lastTriggeredDiff >= 1
        && (
            greetingRegex.test(context.request.text)
        ||  hasSticker(context.request, incomingGreetingStickersIds)
        );
  },
  action: (context) => {
    if (context?.request?.isOutbox) {
      return;
    }
    enqueueMessage({
      ...context,
      response: {
        ...context.response,
        sticker_id: getRandomElement(outgoingGreetingStickersIds)
      }
    });
  }
};

module.exports = {
  trigger,
  commonGreetingStickersIds,
  incomingGreetingStickersIds,
  outgoingGreetingStickersIds,
  greetingRegex
};
