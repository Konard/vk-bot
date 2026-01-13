const {
  trigger: chatGptTrigger,
  chatGptTriggerKeywords,
  containsChatGptKeywords,
  generateChatGptResponse
} = require('../../triggers/chatgpt-response');
const { enqueueMessage } = require('../../outgoing-messages');
const { DateTime } = require('luxon');

jest.mock('../../outgoing-messages');

// Mock fetch for OpenAI API calls
global.fetch = jest.fn();

const triggerDescription = 'ChatGPT response trigger';

describe(triggerDescription, () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
    fetch.mockClear();
  });

  describe('containsChatGptKeywords', () => {
    test.each([
      ['Привет, chatgpt, как дела?'],
      ['Ответь как ИИ'],
      ['что думает нейросеть?'],
      ['ChatGPT помоги'],
      ['чатгпт'],
      ['AI answer'],
      ['искусственный интеллект'],
      ['openai']
    ])('"%s" contains ChatGPT keywords', (text) => {
      expect(containsChatGptKeywords(text)).toBe(true);
    });

    test.each([
      ['просто обычное сообщение'],
      ['привет как дела'],
      ['что нового?'],
      [''],
      [null],
      [undefined]
    ])('"%s" does not contain ChatGPT keywords', (text) => {
      expect(containsChatGptKeywords(text)).toBe(false);
    });
  });

  describe('trigger condition', () => {
    test('should trigger for user messages with ChatGPT keywords', () => {
      const context = {
        request: {
          isFromUser: true,
          isOutbox: false,
          text: 'Привет chatgpt',
          peerType: 'user'
        },
        state: {}
      };
      expect(chatGptTrigger.condition(context)).toBe(true);
    });

    test('should not trigger for outgoing messages', () => {
      const context = {
        request: {
          isFromUser: false,
          isOutbox: true,
          text: 'chatgpt привет',
          peerType: 'user'
        },
        state: {}
      };
      expect(chatGptTrigger.condition(context)).toBe(false);
    });

    test('should not trigger for group messages', () => {
      const context = {
        request: {
          isFromUser: true,
          isOutbox: false,
          text: 'chatgpt привет',
          peerType: 'chat'
        },
        state: {}
      };
      expect(chatGptTrigger.condition(context)).toBe(false);
    });

    test('should not trigger if cooldown period has not passed', () => {
      const recentTime = DateTime.now().minus({ minutes: 15 }); // 15 minutes ago (less than 30 min cooldown)
      const context = {
        request: {
          isFromUser: true,
          isOutbox: false,
          text: 'chatgpt привет',
          peerType: 'user'
        },
        state: {
          triggers: {
            ChatGptResponseTrigger: {
              lastTriggered: recentTime
            }
          }
        }
      };
      expect(chatGptTrigger.condition(context)).toBe(false);
    });

    test('should trigger if cooldown period has passed', () => {
      const oldTime = DateTime.now().minus({ hours: 1 }); // 1 hour ago (more than 30 min cooldown)
      const context = {
        request: {
          isFromUser: true,
          isOutbox: false,
          text: 'chatgpt привет',
          peerType: 'user'
        },
        state: {
          triggers: {
            ChatGptResponseTrigger: {
              lastTriggered: oldTime
            }
          }
        }
      };
      expect(chatGptTrigger.condition(context)).toBe(true);
    });

    test('should not trigger for messages without ChatGPT keywords', () => {
      const context = {
        request: {
          isFromUser: true,
          isOutbox: false,
          text: 'обычное сообщение',
          peerType: 'user'
        },
        state: {}
      };
      expect(chatGptTrigger.condition(context)).toBe(false);
    });
  });

  describe('generateChatGptResponse', () => {
    let originalKey;

    beforeEach(() => {
      originalKey = process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    test('should return null when OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await generateChatGptResponse('test message');
      expect(response).toBeNull();
    });

    test('should call OpenAI API and return response when API key is set', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Тестовый ответ от ChatGPT'
            }
          }]
        })
      });

      const response = await generateChatGptResponse('Привет');
      expect(response).toBe('Тестовый ответ от ChatGPT');
      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const response = await generateChatGptResponse('test');
      expect(response).toBeNull();
    });

    test('should truncate long responses', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const longResponse = 'A'.repeat(600); // Longer than MAX_RESPONSE_LENGTH (500)

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: longResponse
            }
          }]
        })
      });

      const response = await generateChatGptResponse('test');
      expect(response).toBe('A'.repeat(500) + '...');
    });
  });

  describe('trigger action', () => {
    let originalKey;

    beforeEach(() => {
      originalKey = process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    test('should enqueue ChatGPT response when API returns valid response', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Привет! Как дела?'
            }
          }]
        })
      });

      const context = {
        request: { text: 'chatgpt привет' },
        state: { history: [] }
      };

      await chatGptTrigger.action(context);

      expect(enqueueMessage).toHaveBeenCalledWith({
        ...context,
        response: {
          message: 'Привет! Как дела?'
        }
      });
    });

    test('should enqueue fallback message when API fails', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      fetch.mockRejectedValueOnce(new Error('API Error'));

      const context = {
        request: { text: 'chatgpt привет' },
        state: { history: [] }
      };

      await chatGptTrigger.action(context);

      expect(enqueueMessage).toHaveBeenCalledWith({
        ...context,
        response: {
          message: 'Извините, сейчас не могу ответить с помощью ИИ. Попробуйте позже.'
        }
      });
    });

    test('should enqueue fallback message when no API key is set', async () => {
      delete process.env.OPENAI_API_KEY;

      const context = {
        request: { text: 'chatgpt привет' },
        state: { history: [] }
      };

      await chatGptTrigger.action(context);

      expect(enqueueMessage).toHaveBeenCalledWith({
        ...context,
        response: {
          message: 'Извините, сейчас не могу ответить с помощью ИИ. Попробуйте позже.'
        }
      });
    });
  });
});