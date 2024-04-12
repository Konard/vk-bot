const { trigger: gratitudeTrigger, outgoingGratitudeResponseStickerId } = require('../../triggers/gratitude');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'gratitude trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Благодарю! 🙏♥🙏'],
    ['🙂Спасибо!'],
    ['Спасибо большое!'],
    ['Спасибо'],
    ['Спасибо Вам.'],
    ['Благодарю Вас!. 😍'],
    ['Спасибо, дорогой!)'],
    ['Сяб'],
    ['пасиба'],
    ['Спосибо'],
    ['спс ☺'],
    ['Спасибочки'],

    ["Bol'shoye spasibo! 👍"],
    
    ['От Всей Души✋👋'],
    ['От души брат, спасибо!'],
    ['Спасибо, бро'],
    ['От души спасибо'],
    ['От души 🤝'],
    
    ['Спасибо за поздравление, мне приятно✨✨✨'],
    ['Благодарю за поздравления! Очень приятно!'],
    ['Спасибо большое🙏💕!!! Мне очень приятно!)))'],
    ['Спасибо большое, очень приятно.)'],

    ['Спасибо большое за поздравление!'],
    ['Спасибо большое за поздравления'],
    ['Спасибо большое за поздравления 🤝'],
    ['Спасибо большое за поздравление 🌹'],
    ['Благодарю, спасибо большое за поздравление,,!'],
    ['Благодарим за поздравления!'],
    ['Спасибо большое за поздравление 😉'],
    ['Благодарю за поздравление!'],

    ['Привет!)\nСпасибо огромное ☺'],
    ['Привет 👋 Спасибо большое 💞💞💞💞'],
    ['Здравствуй ! Спасибо большое ☺'],
    ['Приветик, спасибо огромное за поздравления) ❤‍🩹😚'],
    ['Благодарю, очень приятно!🙏🙂'],
    ['Добрый день! Благодарю, очень приятно!🙏🙂'],
    ['Добрый день, Константин! Благодарю за поздравление 🤝'],
    ['Спасибо большое за добрые поздравления🙂🤗🌞'],

    ['Костя спасибо ❤'],
    ['Константин, благодарю!'],
    ['Огромнейшее спасибо Константин!👍'],
    ['Благодарю, Константин!) 🙏'],
    ['Благодарю Константин!'],
    ['Благодарю за поздравления и пожелания, Константин!!!'],
    ['Спасибо, Константин!'],
    ['Спасибо Кость) 🤝🤝🤝'],
    ['Спасибо Кость!!!'],
    ['Спасибо, Константин! 💥'],
    ['Константин привет! Спасибо большое!☺👍'],
    ['Константин, большое Вам спасибо за поздравление!!!'],
    ['Благодарю, Константин!'],
    ['Константин, спасибо!'],
    ['Благодарю тебя Константин 🫶'],
    ['Спасибо большое Костя'],
    ['Спасибо Константин! 🤝'],
  ])(`"%s" matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    // console.log('incomingMessage', incomingMessage);
    const context = { request: { isFromUser: true, isOutbox: false, text: incomingMessage } };
    expect(gratitudeTrigger.condition(context)).toBe(true);
    if (gratitudeTrigger.condition(context)) {
      gratitudeTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(callArg.response.sticker_id).toEqual(outgoingGratitudeResponseStickerId);
  });
});