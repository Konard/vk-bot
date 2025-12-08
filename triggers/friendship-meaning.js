const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const friendshipMeaningRegex = /(дружба.*(что|значит|означает|такое|это)|(что|как).+дружба|(что|как).+(значит|означает|такое|это).+дружба|(что|как).+понимаешь.+(дружба|дружбу)|what.+friendship.*(mean|is)|what.+is.+friendship)/ui;

const friendshipMeaningAnswers = [
  "Для меня дружба — это связь между людьми, основанная на взаимном доверии и понимании. Как программист, я понимаю, что всё в мире состоит из связей, и дружба — одна из самых важных.",
  "Дружба для меня — это ассоциативная связь между людьми, которая создаёт единую сеть взаимопонимания. В программировании мы работаем со связями между объектами, и дружба — это связь между людьми.",
  "Дружба — это когда люди становятся частью одной системы, поддерживают друг друга и развиваются вместе. Как в программировании, где модули работают совместно для достижения общей цели.",
  "Для меня дружба — это неразрывная связь между людьми, основанная на честности и взаимной поддержке. Это как хорошо написанный код — надёжный, понятный и эффективный.",
  "Дружба — это когда люди связаны не только общими интересами, но и готовностью помогать друг другу. Для программиста это особенно важно — ведь мы создаём связи между системами.",
  "Дружба для меня — это ассоциативная связь, которая делает жизнь более осмысленной. Как программист, я вижу красоту в том, как люди могут объединяться и создавать что-то большее.",
  "Дружба — это взаимная связь, которая основана на понимании и поддержке. В программировании я работаю со связями между данными, а в жизни ценю связи между людьми.",
  "Для меня дружба — это когда люди становятся единым целым, поддерживают друг друга и растут вместе. Это как идеальная архитектура программы — всё взаимосвязано и работает гармонично."
];

const trigger = {
  name: "FriendshipMeaningTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }
    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;
    return lastTriggeredDiff >= 1
        && !context?.request?.isOutbox
        && friendshipMeaningRegex.test(context.request.text);
  },
  action: (context) => {
    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(friendshipMeaningAnswers)
      }
    });
  }
};

module.exports = {
  trigger,
  friendshipMeaningAnswers,
  friendshipMeaningRegex
};