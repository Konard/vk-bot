const { gratitudeTrigger, outgoingGratitudeResponseStickerId } = require('../../triggers/gratitude');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('gratitudeTrigger', () => {
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
    ['спс ☺'],
    ['Спасибочки'],

    ["Bol'shoye spasibo! 👍"],
    
    ['От Всей Души✋👋'],
    
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

    ['Костя спасибо ❤'],
    ['Константин, благодарю!'],
    ['Огромнейшее спасибо Константин!👍'],
    ['Благодарю, Константин!) 🙏'],
    ['Благодарю за поздравления и пожелания, Константин!!!'],
    ['Спасибо, Константин!'],
    ['Спасибо Кость) 🤝🤝🤝'],
    ['Спасибо, Константин! 💥'],
    ['Константин привет! Спасибо большое!☺👍'],
    ['Константин, большое Вам спасибо за поздравление!!!'],
    ['Благодарю, Константин!'],
    ['Константин, спасибо!'],
    ['Благодарю тебя Константин 🫶'],
    ['Спасибо большое Костя'],
    ['Спасибо Константин! 🤝'],
  ])('matches "%s" greeting trigger and gives expected response', (incomingMessage) => {
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

  // test.each([
  //   ['Чем занимаешься?'], 
  //   ['Какая цель добавления в друзья?']
  // ])('does not match "%s" question', (incomingMessage) => {
  //   const context = { request: { text: incomingMessage } };
  //   expect(gratitudeTrigger.condition(context)).toBe(false);
  //   if (gratitudeTrigger.condition(context)) {
  //     gratitudeTrigger.action(context);
  //   }
  //   expect(enqueueMessage).not.toHaveBeenCalled();
  // });
});