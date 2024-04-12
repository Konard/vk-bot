const { hasSticker, getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { stickers } = require('../stickers');

const hello = /(привет(ик)?|здравствуй|добрый[^\p{L}]+(день|вечер))/;
const mention = /(константин|костя|кость)/;
const qualification = /(огромнейшее|огромное|большое|bol'shoye)/;
const whitespace = /[^\p{L}]*/;
const pronoun = /(вам|вас|тебе|тебя|дорог(ой|ая)|бро|брат)/;

// TODO: СПАСИБО КОНСТАНТИН!!!!
// const gratitudeRegex = /^[^\p{L}]*((константин|костя|кость)[^\p{L}]*)?(благодарю|(огромное|большое[^\p{L}]*)?((вам|тебе)[^\p{L}]*)?спасибо([^\p{L}]*(огромное|большое))?)([^\p{L}]*((тебя)[^\p{L}]*)?(константин|костя|кость))?[^\p{L}]*$/ui;

const test = [];

const transform = (expression) => {
  if (Array.isArray(expression)) {
    let result = '';
    for (const item of expression) {
      if (item instanceof RegExp) {
        result += item.source;
      } else {
        result += transform(item);
      }
    }
    return result;
  } else {
    return expression;
  }
}

const gratitudeRegexString = transform([
  '^',
  whitespace,
  '(',
  [
    mention,
    whitespace,
  ],
  ')',
  '?',
  '(',
  [
    hello,
    whitespace,
  ],
  ')',
  '?',
  '(',
  [
    mention,
    whitespace,
  ],
  ')',
  '?',
  '(',
  [
    'благодар(ю|им)',
    whitespace,
  ],
  ')',
  '?',
  '(',
  [
    [
      'благодар(ю|им)',
    ],
    '|',
    [
      '(',
      [
        qualification,
        whitespace,
      ],
      ')',
      '?',
      '(',
      [
        pronoun,
        whitespace,
      ],
      ')',
      '?',
      '(',
      [
        'с?п[ао]сиб[оа](чки)?',
        '|',
        'спс',
        '|',
        'сяб',
        '|',
        'spasibo',
        '|',
        '(',
        [
          'от',
          '(',
          [
            whitespace,
            'всей',
          ],
          ')',
          '?',
          whitespace,
          'души',
          '(',
          [
            whitespace,
            'брат',
          ],
          ')',
          '?',
          '(',
          [
            whitespace,
            'с?п[ао]сиб[оа](чки)?',
          ],
          ')',
          '?',
        ],
        ')',
      ],
      ')',
      '(',
      [
        whitespace,
        qualification,
      ],
      ')',
      '?',
    ],
  ],
  ')',
  '(',
  [
    whitespace,
    'за',
    '(',
    [
      whitespace,
      'добрые',
    ],
    ')',
    '?',
    whitespace,
    'поздравлени[ея]',
    '(',
    [
      whitespace,
      'и',
      whitespace,
      'пожелани[ея]',
    ],
    ')',
    '?'
  ],
  ')',
  '?',
  '(',
  [
    '(',
    [
      whitespace,
      'мне',
    ],
    ')',
    '?',
    '(',
    [
      whitespace,
      'очень',
    ],
    ')',
    '?',
    whitespace,
    'приятно',
  ],
  ')',
  '?',
  '(',
  [
    whitespace,
    pronoun,
  ],
  ')',
  '?',
  '(',
  [
    whitespace,
    mention,
  ],
  ')',
  '?',
  whitespace,
  '$',
]);

// const gratitudeRegex = new RegExp(`^${whitespace.source}(${mention.source}${whitespace.source})?(благодарю|(${qualification.source}${whitespace.source})?(${pronoun.source}${whitespace.source})?спасибо(${whitespace.source}${qualification.source})?)(${whitespace.source}(${pronoun.source}${whitespace.source})?${mention.source})?${whitespace.source}$`, "ui");

const gratitudeRegex = new RegExp(gratitudeRegexString, "ui");

// console.log(gratitudeRegexString);
// console.log(gratitudeRegexString == gratitudeRegex.source);

// var lower = new RegExp(/--RegexCode--/);
// var upper = new RegExp(/--RegexCode--/);
// hence, regex can be dynamically created. After creation:

// "sampleString".replace(/--whatever it should do--/);
// Then you can combine them normally, yes.

// var finalRe = new RegExp(lower.source + "|" + upper.source);

// ([^\p{L}]*((тебя)[^\p{L}]*)?

const incomingGratitudeStickersIds = [
  6342,   // СПАСИБО
  66407,  // СПАСИБО
  57689,  // СПАСИБО СПАСИБО
  53771,  // СПАСИБО
  100140, // СПАСИБО ♡
  95564,  // БЛАГОДАРЮ
  74836,  // СПАСИБО!
  13457,  // БЛАГОДАРЮ
  61452,  // СПАСИБО
  17925,  // БЛАГОДАРЮ
  89254,  // СПАСИБО!
  76589,  // СПАСИБО
  54085,  // СПАСИБО
  51599,  // СПАСИБО
  71370,  // СПАСИБОЧКИ
  66424,  // СПАСИБО!
  12995,  // СПАСИИИБО
  15897,  // СПАСИБО
  3698,   // СПАСИБО
  68782,  // СПАСИБО
  13428,  // СПАСИБКИ
  58613,  // ОТ ДУШИ
  12673,  // СПАСИБО
  10253,  // СПАСИБО!
  65703,  // СПАСИБО
  94568,  // СПАСИБО
  20406,  // СПАСИИИБА!
  6164,   // СПАСИБО
  51266,  // СПАСИБО
  94594,  // СПАСИБО
  stickers.gratitude['Asteria'].id,
  stickers.gratitude['Bengal and Somali'].id,
  stickers.gratitude['Best friends'].id,
  stickers.gratitude['Emily'].id,
  stickers.gratitude['No Words Needed'].id,
  stickers.gratitude['Vladik'].id,
  stickers.gratitude['Your vmoji'].id,
  stickers.gratitude['oni-chan'].id,
];

const outgoingGratitudeResponseStickerId = 60075;

const trigger = {
  name: "GratitudeTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    return !context?.request?.isOutbox
      && (
        gratitudeRegex.test(context.request.text)
        || hasSticker(context.request, incomingGratitudeStickersIds)
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
  trigger,
  outgoingGratitudeResponseStickerId
};