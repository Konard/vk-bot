const { VK } = require('vk-io');
const { getRandomElement, sleep, getToken } = require('../utils');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('../outgoing-messages');
const { at } = require('lodash');
const token = getToken();
const vk = new VK({ token });

const birthdayStickerIds = [
  60302,
  89461, // C ДР!
  92727, // С Днём рождения!
  72627,
  56507, // C ДР!
  59429,
];

// const neuronalMiracleAudio = 'audio-2001064727_125064727';
// const daysOfMiraclesAudio = 'audio-2001281499_119281499';

// const audioAttachments = [
//   neuronalMiracleAudio,
//   daysOfMiraclesAudio
// ];

// Абзац 1: Приветствие (без дополнительных пожеланий)
const paragraph1Variants = [
  "🎉 С днём рождения!",
  "🎂 Поздравляю с днём рождения!",
  "🎈 С днём рождения, поздравляю!",
  "🎉 С твоим днём рождения!",
  "🎉 День рождения – особенный день! Поздравляю!"
];

// Абзац 2: О дружбе и связях
const paragraph2Variants = [
  "Сегодня хочу напомнить, что наша дружба – это невидимая связь, объединяющая нас 🤝. Я как исследователь ассоциативности вижу, что всё есть связь и всё связано.",
  "В этот день я осознаю, что наша связь – это не просто дружба, а неразрывное единство 🔗. Для меня, как ассоциативного программиста, всё связано и имеет глубокий фрактальный смысл.",
  "Наша дружба – твёрдая связь, которая объединяет нас и наших друзей 🌐. Будучи ассоциативным программистом, я понимаю, что каждая часть этого мира — это связь.",
  "Помни, что наша связь — это уникальный мост между нами 🌉. Для меня, как для ассоциативного программиста, мир представляет собой сеть связей.",
  "Наша дружба – удивительная связь, делающая нас единым целым ✨. И я верю, что всё в мире состоит из связей."
];

// Абзац 3: О здоровье, силе и гармонии
const paragraph3Variants = [
  "💕 Клеточные связи твоего тела обеспечивают здоровье, а отношения с людьми дарят силу и возможности. Пусть внутренняя гармония принесёт радость, а все планы воплотятся в жизнь 💪.",
  "💕 Связь между клетками поддерживает твое здоровье, а теплые отношения с окружающими рождают возможности. Пусть гармония с собой и миром станет источником радости 🌟.",
  "💕 Связи внутри организма укрепляют твое здоровье, а общение с людьми придаёт уверенность и силу. Желаю, чтобы гармония с миром наполнила тебя энергией 🚀.",
  "💕 Здоровье – результат связей между клетками, а возможности – дар общения. Пусть гармония в душе и с миром подарит удовлетворение, а мечты станут реальностью 😊.",
  "💕 Здоровье начинается со связи между клетками твоего тела, а крепкие дружеские отношения дарят силу и уверенность. Пусть внутренняя гармония и согласие с миром помогут тебе достигать всех целей 👍."
];

// Абзац 4: Возможность воспользоваться моими связями в качестве подарка
const paragraph4Variants = [
  "В качестве подарка я предлагаю тебе воспользоваться моей сетью связяй для решения любого одного твоего вопроса. Дополнительно, я могу перевести 7 рублей на баланс мобильного телефона.",
  "Я дарю тебе возможность воспользоваться моими связями для решения любого одного твоего вопроса. Кроме того, я могу перевести 7 рублей на баланс мобильного телефона в качестве символического бонуса.",
  "Так как у меня есть связи, подарком от меня будет возможность получить помощь для решения любого одного твоего вопроса. И ещё, я могу перевести 7 рублей на баланс мобильного телефона.",
  "В подарок тебе предоставляется возможность воспользоваться моими связями для решения любого одного твоего вопроса. Также я могу перевести 7 рублей на баланс мобильного телефона в качестве дополнительго подарка.",
  "У меня много связей и я предлагаю тебе, в качестве подарка помощь в решении любого одного твоего вопроса. В дополнение, я могу перевести 7 рублей на баланс мобильного телефона."
];

// Абзац 5: Путешествие в мир ассоциативности с музыкой
const paragraph5Variants = [
  "Если понятия связей и ассоциативности ещё окутаны тайной для тебя, я приглашаю тебя в путешествие: слушай музыку из прикреплённого видеоролика 🎶, пока читаешь нашу статью о теории связей, которую я прорабатывал эти годы. Ссылка на статью указана в описании к ролику.",
  "Если для тебя ассоциативность остаётся загадкой, послушай музыку из видеоролика 🎵 и одновременно прочти нашу статью о теории ассоциативности, отражающую труд всей моей жизни. Ссылку на статью ты найдёшь в описании к видеоролику.",
  "Я приглашаю тебя в путешествие по миру ассоциативности: во время чтения статьи, являющейся результатом труда всей моей жизни, слушай прикреплённую музыку 🎧. Ссылку на статью можно найти в описании к ролику.",
  "Если тебя тебе интересно разгадать что такое связи и ассоциативность, включи музыку из видеоролика 🎼 и прочти нашу статью о теории, которая является результатом трудов всей моей жизни. Ссылку на статью можно найти в описании к видеоролику.",
  "Открой для себя мир ассоциативности: слушай музыку из видеоролика 🎶, пока читаешь статью о теории связей, являющуюся трудом всей моей жизни. Ссылку на статью увидеть в описании к ролику."
];

async function sendBirthdayCongratulations() {
  let offset = 0;
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;

  while (true) {
    if (offset >= 10000) break;

    const response = await vk.api.friends.get({
      fields: ['bdate'],
      count: 5000,
      offset,
    });

    if (response.items.length === 0) break;

    for (const friend of response.items) {
      if (friend.bdate) {
        const [day, month] = friend.bdate.split('.');
        if (day == currentDay && month == currentMonth) {
          console.log('friend.id', friend.id);

          // Отправка стикера
          enqueueMessage({
            vk,
            response: {
              user_id: friend.id,
              sticker_id: getRandomElement(birthdayStickerIds),
            }
          });

          // Формирование финального сообщения из случайных вариантов каждого абзаца
          const finalMessage = `${getRandomElement(paragraph1Variants)}\n\n` +
            `${getRandomElement(paragraph2Variants)}\n\n` +
            `${getRandomElement(paragraph3Variants)}\n\n` +
            `${getRandomElement(paragraph4Variants)}\n\n` +
            `${getRandomElement(paragraph5Variants)}`;

          // Отправка поздравительного сообщения с видеороликом
          enqueueMessage({
            vk,
            response: {
              user_id: friend.id,
              message: finalMessage,
              // attachment: getRandomElement(audioAttachments)
              attachment: 'video3972090_456239795'
            }
          });
        }
      }
    }
    offset += 5000;
  }
}

const trigger = {
  name: "SendBirthdayCongratulations",
  action: async (context) => {
    return await sendBirthdayCongratulations(context);
  }
};

module.exports = {
  trigger
};