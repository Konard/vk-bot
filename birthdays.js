const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('./outgoing-messages');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const birthdayStickerIds = [
  60302,
  89461, // C ДР!
  92727, // С Днём рождения!
  72627,
  56507, // C ДР!
  59429,
]
const birthdayCongratulations = [
  `Поздравляю с днём рождения 🎉

Дарю один ответ на любой вопрос по программированию и автоматизации. 🎈`,
  `🎉 Поздравляю тебя с днём рождения!

В этот особенный день, я хочу подарить тебе знание - ответ на любой вопрос по программированию и автоматизации.`,
  `С днём рождения! 💥

Надеюсь, что твой день будет полон радости, а год впереди - прогресса и достижений. И чтобы помочь с этим, я подарю тебе ответ на любой вопрос по программированию и автоматизации.`,
  `Счастливого тебе дня рождения! 🎂

В честь этого дня, я готов подарить тебе ответ на один вопрос по программированию и автоматизации.`,
  `Поздравляю с днём рождения! 🥳

Дарю тебе подарок, который, надеюсь, оценит каждый - ответ на вопрос по программированию и автоматизации. `,
  `Самый душевный подарок — это знания, поэтому на твой день рождения, я предлагаю тебе в качестве подарка ответ на вопрос по программированию и автоматизации.

С днём Рождения! 🎈`,
];

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

async function congratulateFriendsWithBD() {
  let offset = 0;
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;

  while (true) {
    if (offset >= 10000) {
      break;
    }

    const response = await vk.api.friends.get({
      fields: ['bdate'],
      count: 5000,
      offset,
    });

    console.log('response.items.length', response.items.length);

    if (response.items.length === 0) {
      break;
    }

    for (const friend of response.items) {
      if (friend.bdate) {
        const [day, month] = friend.bdate.split('.');
        if (day == currentDay && month == currentMonth) {
          console.log('friend.id', friend.id);
          enqueueMessage({
            vk,
            response: {
              user_id: friend.id,
              sticker_id: getRandomElement(birthdayStickerIds),
            }
          });
          enqueueMessage({
            vk,
            response: {
              user_id: friend.id,
              message: getRandomElement(birthdayCongratulations),
              attachment: getRandomElement(audioAttachments)
            }
          });
        }
      }
    }

    offset += 5000;
  }
}

let finished = false;

congratulateFriendsWithBD().then(() => { 
  finished = true
}).catch((e) => {
  finished = true;
  console.error(e);
});

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);

const finalizerInterval = setInterval(() => {
  if (finished && queue.length == 0) {
    setTimeout(() => {
      clearInterval(messagesHandlerInterval);
    }, 10000);
    clearInterval(finalizerInterval);
  }
}, 1000);