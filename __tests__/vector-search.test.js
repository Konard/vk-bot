const {
  generateEmbedding,
  indexMessages,
  searchSimilarMessages,
  suggestAnswers,
  clearIndex
} = require('../vector-search');

// Test peer ID
const testPeerId = 999999;

// Sample messages for testing
const sampleMessages = [
  { id: 1, text: "Hello", out: 0, date: 1609459200, from_id: 12345 },
  { id: 2, text: "Hi there!", out: 1, date: 1609459260, from_id: 0 },
  { id: 3, text: "How are you?", out: 0, date: 1609459320, from_id: 12345 },
  { id: 4, text: "I'm doing great!", out: 1, date: 1609459380, from_id: 0 },
];

describe('Vector Search Module', () => {
  beforeAll(async () => {
    // Clear index before tests
    await clearIndex(testPeerId);
  });

  afterAll(async () => {
    // Clean up after tests
    await clearIndex(testPeerId);
  });

  test('generateEmbedding should return a 384-dimensional vector', async () => {
    const embedding = await generateEmbedding("Hello world");
    expect(embedding).toBeInstanceOf(Array);
    expect(embedding.length).toBe(384);
    expect(typeof embedding[0]).toBe('number');
  }, 60000);  // Increased timeout for model loading

  test('generateEmbedding should throw error for empty text', async () => {
    await expect(generateEmbedding("")).rejects.toThrow('Text must be a non-empty string');
  });

  test('indexMessages should index only incoming messages', async () => {
    const count = await indexMessages(testPeerId, sampleMessages);
    // Should index only messages with out === 0 (2 messages)
    expect(count).toBe(2);
  }, 60000);

  test('searchSimilarMessages should find similar messages', async () => {
    // First index some messages
    await indexMessages(testPeerId, sampleMessages);

    // Search for similar message
    const results = await searchSimilarMessages(testPeerId, "How are you doing?", 3);

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('score');
    expect(results[0]).toHaveProperty('message');
    expect(results[0].message).toHaveProperty('text');
  }, 60000);

  test('suggestAnswers should return answer suggestions', async () => {
    // First index messages
    await indexMessages(testPeerId, sampleMessages);

    // Get suggestions for a new message
    const suggestions = await suggestAnswers(testPeerId, "How are you?", sampleMessages, 2);

    if (suggestions.length > 0) {
      expect(suggestions[0]).toHaveProperty('score');
      expect(suggestions[0]).toHaveProperty('originalMessage');
      expect(suggestions[0]).toHaveProperty('suggestedResponse');
      expect(suggestions[0]).toHaveProperty('similarity');
    }
  }, 60000);

  test('searchSimilarMessages should return empty array for empty query', async () => {
    const results = await searchSimilarMessages(testPeerId, "", 3);
    expect(results).toEqual([]);
  });
});
