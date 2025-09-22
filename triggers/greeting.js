const { hasSticker, getRandomElement } = require('../utils');
const { sendMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');
const { stickers } = require('../stickers');
const { getOrLoadMessages } = require('../messages-cache');

const greetingRegex = /^[^\p{L}]*((трям|🖖|👋|🖐|мо[иё] приветстви[ея]|салам|салют|з?д[ао]ров[ао]?|ку|q+|шалом|хай|хэллоу|йоу?|привет(ствую|ики?)?|здрав?с(твуй|ь)?(те)?|дд|((день|вечер)[^\p{L}]+)?добр(ый([^\p{L}]*(день|вечер))?|ое[^\p{L}]*утро|ой[^\p{L}]*ночи|ого[^\p{L}]*времени[^\p{L}]*суток))[^\p{L}]*)+([^\p{L}]*(тебе|вам))?[^\p{L}]*$/ui;

// {
//   greetingStickerIds: [
//     81987, 81995, 73601, 15346,  4917,
//     73071, 60062,   134, 75306, 73151,
//      3003, 51417, 72437, 72789, 77664,
//     69175, 76459,    21,  4639, 14409,
//     84592, 92708, 93953, 59397, 86510,
//     91881, 83320, 90965, 56500, 16821,
//     91176, 84235, 85791
//   ]
// }

const allStickersWithHiKeywords = [
  81995,
  73601,
  15346,
  4917,
  73071,
  60062,
  134,
  75306,
  73151,
  3003,
  51417,
  72437,
  72789,
  77664,
  69175,
  76459,
  21,
  4639,
  14409,
  84592,
  92708,
  93953,
  59397,
  86510,
  91881,
  83320,
  90965,
  56500,
  16821,
  91176,
  84235,
  85791,
  4275,
  79394,
  16263,
  12467,
  5785,
  51117,
  8481,
  2418,
  60566,
  7210
];

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
  stickers.greeting['Heartfelt stickers'].id,
  stickers.greeting['Tong'].id,
  stickers.greeting['Your vmoji'].id,
];

const incomingGreetingStickersIds = [...new Set(
  [
    ...commonGreetingStickersIds,
    ...allStickersWithHiKeywords,
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
    4323,  // ПРИВЕТ
    85791, // ПРИВЕТ ПРИВЕТ
    86510, // САЛЮТ
    91176, // ПРИВЕТ
    68335, // CiAO
    84541, // Бонжур
    64785, // ПРИВЕТ
    84235, // ПРИВЕТ
    84236, // ХЕЛЛОУ
    70753,
    16029, // ПРИВЕТИКИ
    58732, // О! ПРИВЕТ!
    18035, // ПРИВЕТ!
    88693, // ЗДРЫ
    86108, // ПРИВЕТ
    59666, // ПРИВЕТИК
    80788, // КУ
    72459, 
    90653, 
    8695,  // ЗДРАСЬТЕ
    62694, // ПРИВЕТ!
    17722, // БОНЖУР
    12115, // ПРИВЕТИКИ
    53098, // НУ ПРИВЕТ
    81248, // ДОБРЫЙ ВЕЧЕР
    56896, // ПРИВЕТ
    76436, // АЛОХА!
    73705, // ПРИВЕТ
    74558, 
    62800, // КУ
    11510, 
    66363, 
    4501,  // ПРИВЕТ!
    98390, // 
    51259, // ПРИВЕТ
    66087, // ПРИВЕТИК
    65253, // ПРИВЕТ
    63426, // ДАРОВА
    61829, // ПРИВЕТИК!
    70784, // ПРИВ
    74108, // ЗДРАВСТВУЙТЕ
    8481,  // 
    89004, // 
    57279, // ПРИВЕТ
    17952, // СӘЛЕМ
    50644, // ПРИВЕТ!
    83820, // П-ПРИВЕТ!
    9469,  // ХАЙ
    79394, // ДАРОВА
    54474, // БОНЖУР!
    stickers.greeting['Elinor'].id,
    stickers.greeting['Emily'].id,
    stickers.greeting['Winter vmoji'].id,
  ]
)];

function intersect(a, b) {
  var setB = new Set(b);
  return [...new Set(a)].filter(x => setB.has(x));
}

const outgoingGreetingStickersIds = [
  ...commonGreetingStickersIds,
];

const trigger = {
  name: "GreetingTrigger",
  condition: async (context) => {
    if (context.request.peerType !== "user") {
      return false;
    }

    // Check if message matches greeting patterns first
    const isGreetingPattern = greetingRegex.test(context.request.text) || hasSticker(context.request, incomingGreetingStickersIds);
    if (!isGreetingPattern) {
      return false;
    }

    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;

    // If already triggered within 24 hours, don't trigger again
    if (lastTriggeredDiff < 1) {
      return false;
    }

    // Check if this is the first message in 24+ hours
    try {
      const messages = await getOrLoadMessages({ context, friendId: context.request.user_id });
      if (!messages || messages.length === 0) {
        // No message history, treat as first message
        return true;
      }

      // Check if the last message (excluding current one) was sent more than 24 hours ago
      const lastMessage = messages.find(msg => msg.id !== context.request.id);
      if (!lastMessage) {
        // Only one message (current), treat as first message
        return true;
      }

      const lastMessageTime = DateTime.fromSeconds(lastMessage.date);
      const timeSinceLastMessage = now.diff(lastMessageTime, 'hours').hours;

      // Only treat as greeting if it's the first message in 24+ hours
      return timeSinceLastMessage >= 24;
    } catch (error) {
      console.error('Error checking message history for greeting trigger:', error);
      // If we can't check message history, fall back to previous behavior
      return true;
    }
  },
  action: async (context) => {
    if (context?.request?.isOutbox) {
      return;
    }
    return await sendMessage({
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
