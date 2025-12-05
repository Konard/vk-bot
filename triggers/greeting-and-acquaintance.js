const { getRandomElement, hasSticker } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');
const { incomingGreetingStickersIds } = require('./greeting');

// Combined responses for greeting + acquaintance question
const combinedResponses = [
  "Привет! Ещё нет, но давай исправим. Я программист. А ты? (можно на ты?)",
  "Привет! Мы не знакомы, но можем познакомиться. Я программист, а ты? (можем на ты?)",
  "Привет! Нет, ещё не знакомы. Я программист :)",
  "Привет! Нет, мы не знакомы. Я программист, а ты? (не против, что на ты?)",
  "Привет! Ещё нет, я программист, предлагаю дружбу :)",
  "Привет! Ещё нет, я программист, а ты? (можем перейти на ты?)",
  "Привет! Не встречались ранее. Давай познакомимся. Я программист, а ты? (переходим на ты?)",
  "Привет! Пока не знакомы, но можно это исправить. Я программист. А ты? (можно на ты?)",
  "Привет! Ещё нет, но я всегда рад новым знакомствам. Я программист, а ты? (продолжим на ты?)",
  "Привет! Пока что нет. Давай познакомимся? Я программист, а ты чем занимаешься? (мы на ты?)",
  "Привет! Пока еще не знакомы. Исправим это? Я программист. А ты? (можно на ты?)",
  "Привет! Мы еще не знакомы. Давай это исправим? Я программист. А ты? (перейдем на ты?)",
];

// Partial regex patterns to match within a message (not requiring full message match)
const greetingPartialRegex = /(трям|🖖|👋|🖐|мо[иё] приветстви[ея]|салам|салют|з?д[ао]ров[ао]?|ку|q+|шалом|хай|хэллоу|йоу?|привет(ствую|ики?)?|здрав?с(твуй|ь)?(те)?|дд|((день|вечер)[^\p{L}]+)?добр(ый([^\p{L}]*(день|вечер))?|ое[^\p{L}]*утро|ой[^\p{L}]*ночи|ого[^\p{L}]*времени[^\p{L}]*суток))/ui;
// Match acquaintance question - look for "знакомы" followed by "?" anywhere in the text
const acquaintancePartialRegex = /знакомы[^\?]*\?/ui;

// Check if message contains both greeting and acquaintance question
function containsGreetingAndAcquaintance(text, attachments) {
  const hasGreeting = greetingPartialRegex.test(text) || hasSticker({ attachments }, incomingGreetingStickersIds);
  const hasAcquaintance = acquaintancePartialRegex.test(text);
  return hasGreeting && hasAcquaintance;
}

const trigger = {
  name: "GreetingAndAcquaintanceTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }

    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;

    return lastTriggeredDiff >= 1
        && !context?.request?.isOutbox
        && containsGreetingAndAcquaintance(context.request.text || '', context.request.attachments);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(combinedResponses)
      }
    });
  }
};

module.exports = {
  trigger,
  combinedResponses,
  containsGreetingAndAcquaintance
};
