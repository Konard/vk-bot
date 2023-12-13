const fs = require('fs');
const { VK } = require('vk-io');
const { handleOutgoingMessage, enqueueMessage } = require('./outgoing-messages');

const peers = {}; // TODO: keep state about what triggers then last triggered for each peer

const hasSticker = (context, stickersIds) => {
  for (const attachment of context?.attachments || []) {
    const stickerId = attachment?.id;
    console.log('stickerId', stickerId);
    return stickersIds.includes(stickerId);
  }
  return false;
}

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
      vk: context.vk,
      request: context.request,
      response: {
        sticker_id: getRandomElement(outgoingGreetingStickersIds),
        random_id: Math.random() // to make each message unique
      }
    });
  }
};

const questionRegex = /^(м)?\?+$/ui;

const questionClarifications = [
  "Ответ на какой конкретный вопрос интересует?",
  "Что является предметом вопроса?",
  "О каком вопросе идет речь?",
  "Какой вопрос подразумевается?",
  "Что конкретно интересует?",
  "В чём вопрос?",
  "В чём суть вопроса?",
  "Чего касается заданный вопрос?",
  "C чем связан вопрос?",
  "С чем связан заданный вопрос?"
];

const acquaintedRegex = /^\s*(мы\s*)?знакомы(\s*с\s*(тобой|вами))?[\s?)\\]*$/ui;

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

const gratitudeRegex = /^\s*(благодарю|(большое\s*)?спасибо)[\s)\\.!😊👍✅🙏]*$/ui;

const incomingGratitudeStickersIds = [
  6342,
]

const outgoingGratitudeResponseStickerId = 60075;

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

// let self;
// async function getSelf() {
//   const [user] = await vk.api.users.get({});
//   console.log('self', JSON.stringify(user));
//   self = user;
// }
// getSelf().catch(console.error);

vk.updates.on(['message_new'], (request) => {
  // console.log('request.isGroup', request.isGroup);
  // console.log('request.isFromGroup', request.isFromGroup);
  // console.log('request.isUser', request.isUser);
  // console.log('request.isFromUser', request.isFromUser);
  if (!request.isFromUser) {
    return;
  }
  if (request.isOutbox) {
    return;
  }

  console.log('request', JSON.stringify(request, null, 2));

  let reactionTriggered = false;

  if (greetingTrigger.condition({ vk, request })) {
    greetingTrigger.action({ vk, request });
    reactionTriggered = true;
  }
  if (questionRegex.test(request.text)) {
    enqueueMessage({
      vk,
      request,
      response: {
        message: getRandomElement(questionClarifications)
      }
    });
    reactionTriggered = true;
  }
  if (acquaintedRegex.test(request.text)) {
    enqueueMessage({
      vk,
      request,
      response: {
        message: getRandomElement(acquaintanceSuggestions)
      }
    });
    reactionTriggered = true;
  }
  if (gratitudeRegex.test(request.text)) {
    enqueueMessage({
      vk,
      request,
      response: {
        sticker_id: outgoingGratitudeResponseStickerId,
      }
    });
    reactionTriggered = true;
  }
  if (reactionTriggered) {
    const userId = request.senderId; // The user who sent a message
    vk.api.messages.markAsRead({
      peer_id: userId,
      start_message_id: request.id // Get the id of the new message
    }).catch(console.error);
  }
});

vk.updates.start().catch(console.error);

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);

const minute = 60 * 1000;
const setOnlineInterval = setInterval(async () => {
  try {
    await vk.api.account.setOnline();
    console.log('Online status is set.');
  } catch (e) {
    console.log('Could not set online status.', e);
  }
}, 14 * minute);