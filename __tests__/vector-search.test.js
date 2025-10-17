const { MessageVectorSearch } = require('../vector-search');

describe('MessageVectorSearch', () => {
  let vectorSearch;

  beforeEach(() => {
    vectorSearch = new MessageVectorSearch();
  });

  test('should initialize successfully', async () => {
    await vectorSearch.init();
    expect(vectorSearch.isInitialized).toBe(true);
    expect(vectorSearch.db).not.toBeNull();
  });

  test('should add messages to the database', async () => {
    await vectorSearch.addMessage('msg1', 'Hello world', { peerId: 'test123' });
    expect(vectorSearch.messageCache.has('msg1')).toBe(true);
    expect(vectorSearch.messageCache.get('msg1')).toBe('Hello world');
  });

  test('should not add empty messages', async () => {
    await vectorSearch.addMessage('msg2', '', { peerId: 'test123' });
    expect(vectorSearch.messageCache.has('msg2')).toBe(false);
  });

  test('should index message history', async () => {
    const messages = [
      { id: 1, text: 'First message', date: Date.now(), out: 0 },
      { id: 2, text: 'Second message', date: Date.now(), out: 1 },
      { id: 3, text: '', date: Date.now(), out: 0 }, // Empty message should be skipped
    ];

    await vectorSearch.indexMessageHistory(messages, 'peer123');

    expect(vectorSearch.messageCache.size).toBe(2);
    expect(vectorSearch.messageCache.has('peer123_1')).toBe(true);
    expect(vectorSearch.messageCache.has('peer123_2')).toBe(true);
    expect(vectorSearch.messageCache.has('peer123_3')).toBe(false);
  });

  test('should find similar messages', async () => {
    const messages = [
      { id: 1, text: 'Привет', date: Date.now(), out: 0 },
      { id: 2, text: 'Здравствуй', date: Date.now(), out: 0 },
      { id: 3, text: 'Спасибо', date: Date.now(), out: 0 },
    ];

    await vectorSearch.indexMessageHistory(messages, 'peer123');

    const similar = await vectorSearch.findSimilar('Доброе утро', 2);

    expect(similar).toBeDefined();
    expect(Array.isArray(similar)).toBe(true);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.length).toBeLessThanOrEqual(2);
  }, 30000); // Increase timeout for embedding model loading

  test('should find messages similar to regex matches', async () => {
    const messages = [
      { id: 1, text: 'Привет!', date: Date.now(), out: 0 },
      { id: 2, text: 'Здравствуй', date: Date.now(), out: 0 },
      { id: 3, text: 'Как дела?', date: Date.now(), out: 0 },
      { id: 4, text: 'До встречи', date: Date.now(), out: 0 },
    ];

    await vectorSearch.indexMessageHistory(messages, 'peer123');

    const greetingRegex = /(привет|здравствуй)/i;
    const similar = await vectorSearch.findSimilarToRegexMatches(messages, greetingRegex, 2);

    expect(similar).toBeDefined();
    expect(Array.isArray(similar)).toBe(true);
    // Should find messages similar to greetings but not matching the regex exactly
    similar.forEach(result => {
      expect(result.text).toBeDefined();
      expect(greetingRegex.test(result.text)).toBe(false); // Should not match the regex
    });
  }, 30000); // Increase timeout for embedding model loading

  test('should handle empty message arrays', async () => {
    const regex = /test/;
    const result = await vectorSearch.findSimilarToRegexMatches([], regex, 5);
    expect(result).toEqual([]);
  });

  test('should handle regex with no matches', async () => {
    const messages = [
      { id: 1, text: 'Hello world', date: Date.now(), out: 0 },
    ];

    await vectorSearch.indexMessageHistory(messages, 'peer123');

    const regex = /xyz123/;
    const result = await vectorSearch.findSimilarToRegexMatches(messages, regex, 5);
    expect(result).toEqual([]);
  });

  test('should clear the database', async () => {
    await vectorSearch.addMessage('msg1', 'Hello world', { peerId: 'test123' });
    expect(vectorSearch.messageCache.size).toBe(1);

    await vectorSearch.clear();
    expect(vectorSearch.messageCache.size).toBe(0);
    expect(vectorSearch.isInitialized).toBe(true);
  });
});
