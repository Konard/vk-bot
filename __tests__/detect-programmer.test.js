const { detectProgrammer, programmingKeywords } = require('../detect-programmer');

describe('detectProgrammer', () => {
  test('should detect programmer from programming keywords in Russian', () => {
    const messages = [
      { id: 1, text: 'Привет! Я занимаюсь программированием на Python' },
      { id: 2, text: 'Изучаю React и Node.js' },
      { id: 3, text: 'Работаю разработчиком' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.indicators.length).toBeGreaterThan(0);
    expect(result.stats.totalMessages).toBe(3);
  });

  test('should detect programmer from programming keywords in English', () => {
    const messages = [
      { id: 1, text: 'I am a software engineer' },
      { id: 2, text: 'Working with JavaScript and TypeScript' },
      { id: 3, text: 'Love coding in Python' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.indicators.length).toBeGreaterThan(0);
  });

  test('should detect programmer from code patterns', () => {
    const messages = [
      { id: 1, text: 'function test() { return true; }' },
      { id: 2, text: 'const myVar = 123;' },
      { id: 3, text: 'let x = await getData();' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.stats.codePatternMatches).toBeGreaterThan(0);
  });

  test('should detect programmer from technology mentions', () => {
    const messages = [
      { id: 1, text: 'Запускаю docker контейнер' },
      { id: 2, text: 'Использую git для версионирования' },
      { id: 3, text: 'Деплою на kubernetes' },
      { id: 4, text: 'Работаю с PostgreSQL базой данных' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should not detect programmer from general conversation', () => {
    const messages = [
      { id: 1, text: 'Привет! Как дела?' },
      { id: 2, text: 'Что делаешь сегодня?' },
      { id: 3, text: 'Пойдём гулять?' },
      { id: 4, text: 'Хорошая погода' },
      { id: 5, text: 'Как твои дела?' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.indicators.length).toBe(0);
  });

  test('should handle empty messages array', () => {
    const messages = [];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.indicators.length).toBe(0);
  });

  test('should handle null messages', () => {
    const result = detectProgrammer(null);

    expect(result.isProgrammer).toBe(false);
    expect(result.confidence).toBe(0);
  });

  test('should handle messages without text', () => {
    const messages = [
      { id: 1 },
      { id: 2, text: null },
      { id: 3, text: '' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(false);
  });

  test('should detect programmer with mixed programming and casual messages', () => {
    const messages = [
      { id: 1, text: 'Привет!' },
      { id: 2, text: 'Работаю над API на Node.js' },
      { id: 3, text: 'Как дела?' },
      { id: 4, text: 'Изучаю алгоритмы' },
      { id: 5, text: 'Спасибо!' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.stats.totalMessages).toBe(5);
    expect(result.stats.keywordMatches).toBeGreaterThan(0);
  });

  test('should detect programmer from framework mentions', () => {
    const messages = [
      { id: 1, text: 'Использую React для фронтенда' },
      { id: 2, text: 'Django отличный фреймворк' },
      { id: 3, text: 'Express.js для сервера' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should detect programmer from GitHub/Git mentions', () => {
    const messages = [
      { id: 1, text: 'Залил коммит на GitHub' },
      { id: 2, text: 'Сделал пулреквест' },
      { id: 3, text: 'Смержил ветку' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
  });

  test('should have correct confidence calculation', () => {
    const messages = [
      { id: 1, text: 'Я программист' },
      { id: 2, text: 'Пишу код на JavaScript' },
      { id: 3, text: 'function test() {}' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.stats.matchRatio).toBeGreaterThan(0);
  });

  test('should limit indicators to top 10', () => {
    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({ id: i, text: 'I am a programmer working with JavaScript' });
    }

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.indicators.length).toBeLessThanOrEqual(10);
  });

  test('should detect from LeetCode/HackerRank mentions', () => {
    const messages = [
      { id: 1, text: 'Решаю задачи на LeetCode' },
      { id: 2, text: 'Прошёл тест на HackerRank' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
  });

  test('should be case insensitive', () => {
    const messages = [
      { id: 1, text: 'JAVASCRIPT' },
      { id: 2, text: 'PyThOn' },
      { id: 3, text: 'ReAcT' },
    ];

    const result = detectProgrammer(messages);

    expect(result.isProgrammer).toBe(true);
    expect(result.stats.keywordMatches).toBeGreaterThan(0);
  });
});
