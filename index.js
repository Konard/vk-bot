const fs = require('fs');
const { VK } = require('vk-io');

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const queue = [];

const greetingRegex = /^(салам|ку|хай|йо(y)?|привет|здравствуй|здравствуйте|добрый\s*день|доброе\s*утро|добрый\s*вечер)\s*[.?!]*$/gi;

const greetings = [
  "Привет",
  "Здравствуй",
  "Здравствуйте",
];

const stickers = [
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
  15346
];

const questionRegex = /^(м)?\?+$/i;

const questionClarifications = [
  "Ответ на какой конкретный вопрос интересует?",
  "Что является предметом вопроса?",
  "О каком вопросе идет речь?",
  "Какой вопрос подразумевается?",
  "Что конкретно интересует?",
  "В чём вопрос?",
  "В чём суть вопроса?",
  "Чего касается заданный вопрос?"
];

const doWeKnowEachOtherRegex = /^(мы\s*)?знакомы(\s*с\s*(тобой|вами))?\s*[?)\\]*$/i;

const meetingSuggestions = [
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

const gratitudeRegex = /^(благодарю|спасибо)\s*[.!]*$/i;

const gratitudeResponseSticker = 60075;

function getRandomElement(array){
  return array[Math.floor(Math.random()*array.length)];
}

function enqueueMessage(options) {
  queue.push({
    wait: randomInRange(2, 10),
    ...options
  });
}
  
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

vk.updates.on(['message_new'], (request) => {
  console.log('request.isGroup', request.isGroup);
  console.log('request.isFromGroup', request.isFromGroup);
  console.log('request.isUser', request.isUser);
  console.log('request.isFromUser', request.isFromUser);
  if (!request.isFromUser) {
    return;
  }

  console.log('request', JSON.stringify(request, null, 2));

  const message = (request.text || "").trim();

  if (greetingRegex.test(message)) {
    enqueueMessage({
      request,
      response: {
        sticker_id: getRandomElement(stickers),
        random_id: Math.random() // to make each message unique
      }
    });
  }
  if (questionRegex.test(message)) {
    enqueueMessage({
      request,
      response: {
        message: getRandomElement(questionClarifications)
      }
    });
  }
  if (doWeKnowEachOtherRegex.test(message)) {
    enqueueMessage({
      request,
      response: {
        message: getRandomElement(meetingSuggestions)
      }
    });
  }
  if (gratitudeRegex.test(message)) {
    enqueueMessage({
      request,
      response: {
        sticker_id: gratitudeResponseSticker,
      }
    });
  }
});

vk.updates.start().catch(console.error);

const messagesHandlerInterval = setInterval(() => {
  const context = queue[0];
  if (!context) { // no messages to send - to nothing
    return;
  }
  if (context.wait > 0) // we have a message to send - wait for the set interval
  {
    console.log('message.wait', context.wait);
    context.wait--;
    return;
  }
  queue.shift(); // dequeue message
  console.log('response', context.response);
  context.request.send(context.response); // send response within the request's context
}, 1000);