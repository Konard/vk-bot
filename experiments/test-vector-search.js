/**
 * Experiment script to test vector search functionality
 * This demonstrates finding messages similar to those matching regex patterns
 */

const { MessageVectorSearch } = require('../vector-search');
const { greetingRegex } = require('../triggers/greeting');
// Create a simple gratitude regex for testing
const gratitudeRegex = /(спасибо|благодар|спс)/ui;

async function runVectorSearchExperiment() {
  console.log('=== Vector Search Experiment ===\n');

  const vectorSearch = new MessageVectorSearch();

  // Sample message history
  const sampleMessages = [
    { id: 1, text: 'Привет!', date: Date.now(), out: 0 },
    { id: 2, text: 'Здравствуй', date: Date.now(), out: 0 },
    { id: 3, text: 'Доброе утро', date: Date.now(), out: 0 },
    { id: 4, text: 'Как дела?', date: Date.now(), out: 0 },
    { id: 5, text: 'Хай', date: Date.now(), out: 0 },
    { id: 6, text: 'Салют', date: Date.now(), out: 0 },
    { id: 7, text: 'Спасибо большое', date: Date.now(), out: 0 },
    { id: 8, text: 'Благодарю', date: Date.now(), out: 0 },
    { id: 9, text: 'Спс', date: Date.now(), out: 0 },
    { id: 10, text: 'Огромное спасибо', date: Date.now(), out: 0 },
    { id: 11, text: 'Я тебе признателен', date: Date.now(), out: 0 },
    { id: 12, text: 'Ценю твою помощь', date: Date.now(), out: 0 },
    { id: 13, text: 'Что нового?', date: Date.now(), out: 0 },
    { id: 14, text: 'Рад тебя видеть', date: Date.now(), out: 0 },
    { id: 15, text: 'До встречи', date: Date.now(), out: 0 },
  ];

  console.log('1. Indexing sample message history...');
  await vectorSearch.indexMessageHistory(sampleMessages, 'test_peer_123');
  console.log('✓ Indexed', sampleMessages.length, 'messages\n');

  // Test 1: Find messages similar to greeting regex matches
  console.log('2. Testing greeting pattern similarity search...');
  console.log('Greeting regex pattern:', greetingRegex);

  const greetingMatches = sampleMessages.filter(msg => greetingRegex.test(msg.text));
  console.log('Messages matching greeting regex:', greetingMatches.map(m => m.text));

  const similarToGreetings = await vectorSearch.findSimilarToRegexMatches(
    sampleMessages,
    greetingRegex,
    3
  );

  console.log('\nMessages similar to greetings (but not matching regex):');
  similarToGreetings.forEach(result => {
    console.log(`  - "${result.text}" (score: ${result.score?.toFixed(4)})`);
  });
  console.log();

  // Test 2: Find messages similar to gratitude regex matches
  console.log('3. Testing gratitude pattern similarity search...');
  console.log('Gratitude regex pattern:', gratitudeRegex);

  const gratitudeMatches = sampleMessages.filter(msg => gratitudeRegex.test(msg.text));
  console.log('Messages matching gratitude regex:', gratitudeMatches.map(m => m.text));

  const similarToGratitude = await vectorSearch.findSimilarToRegexMatches(
    sampleMessages,
    gratitudeRegex,
    3
  );

  console.log('\nMessages similar to gratitude (but not matching regex):');
  similarToGratitude.forEach(result => {
    console.log(`  - "${result.text}" (score: ${result.score?.toFixed(4)})`);
  });
  console.log();

  // Test 3: Direct similarity search
  console.log('4. Testing direct similarity search...');
  const queryText = 'Привет друг';
  console.log(`Query: "${queryText}"`);

  const directSimilar = await vectorSearch.findSimilar(queryText, 5);
  console.log('\nSimilar messages:');
  directSimilar.forEach(result => {
    console.log(`  - "${result.text}" (score: ${result.score?.toFixed(4)})`);
  });

  console.log('\n=== Experiment Complete ===');
}

// Run the experiment
if (require.main === module) {
  runVectorSearchExperiment()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Experiment failed:', error);
      process.exit(1);
    });
}

module.exports = { runVectorSearchExperiment };
