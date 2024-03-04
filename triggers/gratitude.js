const { hasSticker, getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { stickers } = require('../stickers');

const hello = /(привет|здравствуй)/;
const mention = /(константин|костя|кость)/;
const qualification = /(огромнейшее|огромное|большое|bol'shoye)/;
const whitespace = /[^\p{L}]*/;
const pronoun = /(вам|вас|тебе|тебя|дорог(ой|ая))/;

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
        'с?пасиб[оа](чки)?',
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
          'души'
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

console.log(gratitudeRegexString);

console.log(gratitudeRegexString == gratitudeRegex.source);

// var lower = new RegExp(/--RegexCode--/);
// var upper = new RegExp(/--RegexCode--/);
// hence, regex can be dynamically created. After creation:

// "sampleString".replace(/--whatever it should do--/);
// Then you can combine them normally, yes.

// var finalRe = new RegExp(lower.source + "|" + upper.source);

// ([^\p{L}]*((тебя)[^\p{L}]*)?

const incomingGratitudeStickersIds = [
  6342,
  66407, // СПАСИБО
  stickers["oni-chan"].gratitute.id,
];

const outgoingGratitudeResponseStickerId = 60075;

const gratitudeTrigger = {
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
  gratitudeTrigger,
  outgoingGratitudeResponseStickerId
};