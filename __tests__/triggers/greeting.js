const { trigger: greetingTrigger, outgoingGreetingStickersIds } = require('../../triggers/greeting');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

const triggerDescription = 'greeting trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  test.each([
    ['Здравствуйте'],
    ['Привет'],
    ['Приветик'],
    ['Приветики тебе!'],
    ['Здрасте'],
    ['Здрасьте'],
    ['Здравсте'],
    ['День добрый'],
    ['Здравствуйте!'],
    ['Мои приветствия!'],
    ['🖐'],
    ['👋'],
    ['🖖'],
    ['👋👍😊'],
    ['Привет!👋'],
    ['Константин, приветствую 👋'],
    ['Трям🖖'],
    ['Салют'],
    ['Приветствую!'],
    ['Привет Привет 🤝🤝🤝'],
    ['хай!'],
    ['Хэллоу'],
  ])(`"%s" message matches ${triggerDescription} and gives expected response`, (incomingMessage) => {
    const context = { request: { isFromUser: true, text: incomingMessage } };
    expect(greetingTrigger.condition(context)).toBe(true);
    if (greetingTrigger.condition(context)) {
      greetingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(outgoingGreetingStickersIds).toContain(callArg.response.sticker_id);
  });

  test.each([
    [16029], // ПРИВЕТИКИ
    [85081], // ХАЙ, БИЧ
    [58732], // О! ПРИВЕТ!
    [18035], // ПРИВЕТ!
    [88693], // ЗДРЫ
    [86108], // ПРИВЕТ
    [81987], 
    [59666], // ПРИВЕТИК
    [80788], // КУ
    [72459], 
    [90653], 
    [8695],  // ЗДРАСЬТЕ
    [62694], // ПРИВЕТ!
    [17722], // БОНЖУР
    [12115], // ПРИВЕТИКИ
    [53098], // НУ ПРИВЕТ
    [73601], 
    [81248], // ДОБРЫЙ ВЕЧЕР
    [56896], // ПРИВЕТ
    [76436], // АЛОХА!
    [73705], // ПРИВЕТ
    [74558], 
    [62800], // КУ
    [72168], // ПРИВЕТ, ЗАЙ
    [11510], 
    [66363], 
    [4501],  // ПРИВЕТ!
    [98390], // 
    [51259], // ПРИВЕТ
    [66087], // ПРИВЕТИК
    [65253], // ПРИВЕТ
    [63426], // ДАРОВА
    [61829], // ПРИВЕТИК!
    [70784], // ПРИВ
    [74108], // ЗДРАВСТВУЙТЕ
    [84592], // ПРИВЕТ, ДРУГ
    [8481],  // 
    [89004], // 
    [57279], // ПРИВЕТ
    [92708], // ПРИВЕТ
    [17952], // СӘЛЕМ
    [50644], // ПРИВЕТ!
    [83820], // П-ПРИВЕТ!
    [9469],  // ХАЙ
    [79394], // ДАРОВА
    [54474], // БОНЖУР!
  ])(`"%s" sticker matches ${triggerDescription} and gives expected response`, (incomingStickerId) => {
    const context = { request: { isFromUser: true, attachments: [{ id: incomingStickerId }] } };
    expect(greetingTrigger.condition(context)).toBe(true);
    if (greetingTrigger.condition(context)) {
      greetingTrigger.action(context);
    }
    expect(enqueueMessage).toHaveBeenCalled();
    const callArg = enqueueMessage.mock.calls[0][0];
    expect(callArg).toEqual(expect.objectContaining(context));
    expect(outgoingGreetingStickersIds).toContain(callArg.response.sticker_id);
  });
});