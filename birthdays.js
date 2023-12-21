const { VK } = require('vk-io');
const { getRandomElement } = require('./utils');
const { randomInRange, handleOutgoingMessage, enqueueMessage } = require('./outgoing-messages');
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
  `🎉 Поздравляю тебя с днем рождения!

В этот особенный день, я хочу подарить тебе не материальное, а знание - ответ на любой вопрос по программированию или автоматизации.`,
  `С Днем Рождения! 💥

Надеюсь, что твой день будет полон радости, а год впереди - прогресса и достижений. И чтобы помочь с последним, я подарю тебе ответ на любой вопрос о программировании или автоматизации.`,
  `Счастливого тебе Дня Рождения! 🎂

В честь этого дня, готов подарить тебе решение одного вопроса, связанного с программированием или автоматизацией.`,
  `Поздравляю с Днем Рождения! 🥳

Дарю тебе подарок, который, надеюсь, оценит каждый - помощь в ответе на вопрос по программированию или автоматизации. `,
  `Самый душевный подарок — это знания, поэтому на твой День Рождения, я предлагаю тебе ответ на вопрос по программированию или автоматизации.

С Днем Рождения! 🎈`,
]

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
              message: getRandomElement(birthdayCongratulations)
            }
          });
        }
      }
    }

    offset += 5000;
  }
}

congratulateFriendsWithBD().catch(console.error);

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);