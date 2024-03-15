const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const acquaintedRegex = /^[^\p{L}\?]*(мы[^\p{L}\?]*)?знакомы([^\p{L}\?]*с[^\p{L}\?]*(тобой|вами))?[^\p{L}\?]*\?+[^\p{L}]*$/ui;

const acquaintanceSuggestions = [
  "Ещё нет. Однако это просто исправить, я программист. А ты? (можно на ты?)",
  "Мы не знакомы, но это можно исправить. Я программист, а ты? (можем на ты?)",
  "Нет, ещё не знакомы. Можно пробовать исправить: я программист.",
  "Нет, мы не знакомы. Как смотришь на то, чтобы это исправить? Я программист.",
  "Ещё нет, я программист, а ты? (не против, что на ты?)",
  "Ещё нет, я программист.",
  "Ещё нет, я программист, будем дружить?",
  "Ещё нет, я программист, предлагаю дружбу :)",
  "Ещё нет, я программист, а ты? (можем перейти на ты?)",
  "Ещё нет, я программист :)",
  "Нет, я программист, а ты? (продолжим на ты?)",
  "Не встречались ранее. Давай это исправим. Я программист, а ты? (переходим на ты?)",
  "Пока не знакомы, но можно это исправить. Кстати, я программист. А ты? (можно на ты?)",
  "Ещё нет, но я всегда рад новым знакомствам. Я программист, а ты? (продолжим на ты?)",
  "Пока что нет. Давай познакомимся? Я программист, а ты чем занимаешься? (мы на ты?)",
  "Пока еще не знакомы. Исправим это? Я программист. А ты? (можно на ты?)",
  "Мы еще не знакомы. Давай это исправим? Я программист. А ты? (перейдем на ты?)",
  "Мы еще не знакомы, но может исправить это? Я программист :) А ты? (можно на ты?)",
];

const trigger = {
  name: "AcquaintanceTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;
    return lastTriggeredDiff >= 1
        && !context?.request?.isOutbox
        && acquaintedRegex.test(context.request.text);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(acquaintanceSuggestions)
      }
    });
  }
};

module.exports = {
  trigger,
  acquaintanceSuggestions
};