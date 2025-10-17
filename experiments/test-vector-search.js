const {
  generateEmbedding,
  indexMessages,
  searchSimilarMessages,
  suggestAnswers,
  clearIndex
} = require('../vector-search');

// Sample conversation history for testing
const sampleMessages = [
  { id: 1, text: "Привет!", out: 0, date: 1609459200, from_id: 12345 },
  { id: 2, text: "Привет! Как дела?", out: 1, date: 1609459260, from_id: 0 },
  { id: 3, text: "Хорошо, спасибо! А у тебя?", out: 0, date: 1609459320, from_id: 12345 },
  { id: 4, text: "Отлично!", out: 1, date: 1609459380, from_id: 0 },
  { id: 5, text: "Что делаешь?", out: 0, date: 1609459440, from_id: 12345 },
  { id: 6, text: "Работаю над проектом", out: 1, date: 1609459500, from_id: 0 },
  { id: 7, text: "Какая погода?", out: 0, date: 1609459560, from_id: 12345 },
  { id: 8, text: "Солнечно и тепло", out: 1, date: 1609459620, from_id: 0 },
  { id: 9, text: "Чем занимаешься?", out: 0, date: 1609459680, from_id: 12345 },
  { id: 10, text: "Программирую", out: 1, date: 1609459740, from_id: 0 },
  { id: 11, text: "Как настроение?", out: 0, date: 1609459800, from_id: 12345 },
  { id: 12, text: "Хорошее!", out: 1, date: 1609459860, from_id: 0 }
];

const testPeerId = 999999; // Test peer ID

async function runTests() {
  try {
    console.log('=== Vector Search Testing ===\n');

    // Test 1: Generate embedding
    console.log('Test 1: Generating embedding for a sample text...');
    const embedding = await generateEmbedding("Привет, как дела?");
    console.log(`Generated embedding with dimension: ${embedding.length}`);
    console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('✓ Embedding generation successful\n');

    // Test 2: Clear any existing index
    console.log('Test 2: Clearing existing index...');
    await clearIndex(testPeerId);
    console.log('✓ Index cleared\n');

    // Test 3: Index messages
    console.log('Test 3: Indexing sample messages...');
    const indexedCount = await indexMessages(testPeerId, sampleMessages);
    console.log(`✓ Indexed ${indexedCount} messages\n`);

    // Test 4: Search for similar messages
    console.log('Test 4: Searching for similar messages...');
    const query1 = "Как ты?"; // Similar to "Как дела?"
    console.log(`Query: "${query1}"`);
    const results1 = await searchSimilarMessages(testPeerId, query1, 3);
    console.log('Results:');
    results1.forEach((result, idx) => {
      console.log(`  ${idx + 1}. [Score: ${result.score.toFixed(4)}] "${result.message.text}"`);
    });
    console.log();

    const query2 = "Что ты делаешь?"; // Similar to "Что делаешь?" and "Чем занимаешься?"
    console.log(`Query: "${query2}"`);
    const results2 = await searchSimilarMessages(testPeerId, query2, 3);
    console.log('Results:');
    results2.forEach((result, idx) => {
      console.log(`  ${idx + 1}. [Score: ${result.score.toFixed(4)}] "${result.message.text}"`);
    });
    console.log('✓ Similar message search successful\n');

    // Test 5: Suggest answers based on similar questions
    console.log('Test 5: Suggesting answers...');
    const newMessage = "Чем ты занят?"; // Similar to "Что делаешь?" and "Чем занимаешься?"
    console.log(`New incoming message: "${newMessage}"`);
    const suggestions = await suggestAnswers(testPeerId, newMessage, sampleMessages, 3);
    console.log('Suggested responses:');
    if (suggestions.length === 0) {
      console.log('  No suggestions found');
    } else {
      suggestions.forEach((suggestion, idx) => {
        console.log(`  ${idx + 1}. [Similarity: ${suggestion.similarity.toFixed(4)}]`);
        console.log(`     Original: "${suggestion.originalMessage}"`);
        console.log(`     Response: "${suggestion.suggestedResponse}"`);
      });
    }
    console.log('✓ Answer suggestion successful\n');

    // Test 6: Another suggestion test
    console.log('Test 6: Another suggestion test...');
    const newMessage2 = "Как у тебя дела?";
    console.log(`New incoming message: "${newMessage2}"`);
    const suggestions2 = await suggestAnswers(testPeerId, newMessage2, sampleMessages, 3);
    console.log('Suggested responses:');
    if (suggestions2.length === 0) {
      console.log('  No suggestions found');
    } else {
      suggestions2.forEach((suggestion, idx) => {
        console.log(`  ${idx + 1}. [Similarity: ${suggestion.similarity.toFixed(4)}]`);
        console.log(`     Original: "${suggestion.originalMessage}"`);
        console.log(`     Response: "${suggestion.suggestedResponse}"`);
      });
    }
    console.log('✓ Answer suggestion successful\n');

    console.log('=== All tests completed successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
