const { VK } = require('vk-io');
const { getToken } = require('../utils');
const { detectProgrammer } = require('../detect-programmer');
const { getOrLoadMessages } = require('../messages-cache');
const {
  setProgrammerStatus,
  getProgrammerStatus,
  getAllProgrammerStatuses,
} = require('../programmer-status-cache');

const token = getToken();
const vk = new VK({ token });

/**
 * Test programmer detection on a specific friend
 * Usage: node experiments/test-programmer-detection.js [friendId]
 */
async function testProgrammerDetection() {
  const friendId = process.argv[2];

  if (!friendId) {
    console.error('Usage: node experiments/test-programmer-detection.js [friendId]');
    process.exit(1);
  }

  console.log(`Testing programmer detection for friend ID: ${friendId}`);
  console.log('='.repeat(60));

  try {
    // Load messages
    console.log('\n1. Loading message history...');
    const messages = await getOrLoadMessages({ context: { vk }, friendId: parseInt(friendId) });
    console.log(`   Loaded ${messages?.length || 0} messages`);

    if (!messages || messages.length === 0) {
      console.log('\n   ⚠️  No messages found. Unable to detect.');
      return;
    }

    // Show sample messages
    console.log('\n2. Sample messages (first 5):');
    messages.slice(0, 5).forEach((msg, idx) => {
      const text = msg.text || '[no text]';
      const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
      console.log(`   ${idx + 1}. ${preview}`);
    });

    // Detect programmer
    console.log('\n3. Running programmer detection...');
    const detection = detectProgrammer(messages);

    console.log('\n4. Detection Results:');
    console.log('   ='.repeat(58));
    console.log(`   Is Programmer: ${detection.isProgrammer ? '✓ YES' : '✗ NO'}`);
    console.log(`   Confidence: ${detection.confidence}%`);
    console.log(`   Total Messages Analyzed: ${detection.stats.totalMessages}`);
    console.log(`   Keyword Matches: ${detection.stats.keywordMatches}`);
    console.log(`   Code Pattern Matches: ${detection.stats.codePatternMatches}`);
    console.log(`   Total Matches: ${detection.stats.totalMatches}`);
    console.log(`   Match Ratio: ${detection.stats.matchRatio}%`);

    if (detection.indicators.length > 0) {
      console.log('\n5. Programming Indicators Found:');
      detection.indicators.forEach((indicator, idx) => {
        console.log(`   ${idx + 1}. Type: ${indicator.type}, Value: ${indicator.value}`);
      });
    }

    // Check current status in cache
    console.log('\n6. Current Cache Status:');
    const currentStatus = await getProgrammerStatus(friendId);
    if (currentStatus) {
      console.log('   Cached Status:', JSON.stringify(currentStatus, null, 2));
    } else {
      console.log('   No cached status found.');
    }

    // Ask if user wants to save the result
    console.log('\n7. Would you like to save this detection to cache?');
    console.log('   Run the following command to save:');
    console.log(`   node -e "require('./programmer-status-cache').setProgrammerStatus(${friendId}, { isProgrammer: ${detection.isProgrammer}, confidence: ${detection.confidence}, method: 'manual-test', checkedAt: new Date().toISOString() })"`);

    console.log('\n' + '='.repeat(60));
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    process.exit(1);
  }
}

// Run the test
testProgrammerDetection();
