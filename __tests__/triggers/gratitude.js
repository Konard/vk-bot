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
    ['БлагоДарю! и те благого!'],

    ['Привет!)\nСпасибо огромное ☺'],
    ['Привет 👋 Спасибо большое 💞💞💞💞'],
    ['Здравствуй ! Спасибо большое ☺'],
    ['Приветик, спасибо огромное за поздравления) ❤‍🩹😚'],
    ['Благодарю, очень приятно!🙏🙂'],
    ['Добрый день! Благодарю, очень приятно!🙏🙂'],
    ['Добрый день, Константин! Благодарю за поздравление 🤝'],
    ['Добрый вечер и огромное спасибо!'],
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

    ['Thanks you'],
    ['Thank you'],
  ])(`"%s" message matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
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

  test.each([
    [86140],  // БЛАГОДАРЮ
    [57689],  // СПАСИБО СПАСИБО
    [53771],  // СПАСИБО
    [100140], // СПАСИБО ♡
    [95564],  // БЛАГОДАРЮ
    [74836],  // СПАСИБО!
    [88368],  // СПАСИБО
    [13457],  // БЛАГОДАРЮ
    [61452],  // СПАСИБО
    [17925],  // БЛАГОДАРЮ
    [89254],  // СПАСИБО!
    [76589],  // СПАСИБО
    [54085],  // СПАСИБО
    [51599],  // СПАСИБО
    [71370],  // СПАСИБОЧКИ
    [66424],  // СПАСИБО!
    [12995],  // СПАСИИИБО
    [15897],  // СПАСИБО
    [73618],  // МЕРСИ
    [3698],   // СПАСИБО
    [68782],  // СПАСИБО
    [13428],  // СПАСИБКИ
    [58613],  // ОТ ДУШИ
    [94365],  // СПАСИБО
    [12673],  // СПАСИБО
    [10253],  // СПАСИБО!
    [65703],  // СПАСИБО
    [94568],  // СПАСИБО
    [20406],  // СПАСИИИБА!
    [86539],  // СПАСИБО!
    [6164],   // СПАСИБО
    [91892],  // СПАСИБО!
    [51266],  // СПАСИБО
    [72149],  // СПАСИБО, ЗАЮШ
    [94594],  // СПАСИБО
  ])(`"%s" sticker matches ${triggerDescription} and gives expected response`, (incomingStickerId) => {
    // console.log('incomingMessage', incomingMessage);
    const context = { request: { isFromUser: true, isOutbox: false, attachments: [{ id: incomingStickerId }] } };
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