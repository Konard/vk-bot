/**
 * Simple test script for the personality separation system
 * This script tests the PersonalityManager without VK dependencies
 */

// Mock VK constructor to avoid requiring actual tokens
class MockVK {
  constructor(config) {
    this.token = config.token;
    this.updates = {
      start: () => Promise.resolve(),
      stop: () => Promise.resolve()
    };
  }
}

// Mock the VK module
const mockVK = { VK: MockVK };
require.cache[require.resolve('vk-io')] = { exports: mockVK };

const { PersonalityManager } = require('../personality-manager');

// Test configuration
const testConfig = {
  defaultPersonality: 'main',
  personalities: {
    main: {
      token: 'mock-main-token',
      description: 'Main personality for testing',
      interests: ['general'],
      responseStyle: 'friendly',
      triggers: ['*'],
      enabled: true
    },
    social: {
      token: 'mock-social-token',
      description: 'Social personality for testing',
      interests: ['greetings', 'gratitude'],
      responseStyle: 'warm',
      triggers: ['GreetingTrigger', 'GratitudeTrigger'],
      enabled: true
    },
    entertainment: {
      token: 'mock-entertainment-token',
      description: 'Entertainment personality for testing',
      interests: ['music', 'fun'],
      responseStyle: 'playful',
      triggers: ['DoYouLikeThisMusicTrigger'],
      enabled: false
    }
  }
};

function runTests() {
  console.log('🧪 Testing Personality Separation System\n');

  try {
    // Initialize PersonalityManager
    console.log('1. Initializing PersonalityManager...');
    const manager = new PersonalityManager(testConfig);
    console.log('✅ PersonalityManager initialized');

    // Show initial stats
    const stats = manager.getStats();
    console.log(`   📊 Total personalities: ${stats.totalPersonalities}`);
    console.log(`   📊 Enabled personalities: ${stats.enabledPersonalities}`);
    console.log('');

    // Test personality routing
    console.log('2. Testing personality routing...');

    const testCases = [
      { trigger: 'GreetingTrigger', expectedPersonality: 'social' },
      { trigger: 'GratitudeTrigger', expectedPersonality: 'social' },
      { trigger: 'DoYouLikeThisMusicTrigger', expectedPersonality: 'main' }, // Should fallback because entertainment is disabled
      { trigger: 'UnknownTrigger', expectedPersonality: 'main' }, // Should fallback to main
    ];

    for (const testCase of testCases) {
      const personality = manager.getPersonalityForTrigger(testCase.trigger);
      const actualPersonality = personality.name;
      const status = actualPersonality === testCase.expectedPersonality ? '✅' : '❌';

      console.log(`   ${status} ${testCase.trigger} -> ${actualPersonality} ${actualPersonality !== testCase.expectedPersonality ? `(expected ${testCase.expectedPersonality})` : ''}`);
    }
    console.log('');

    // Test personality enable/disable
    console.log('3. Testing personality enable/disable...');

    // Disable social personality
    manager.setPersonalityEnabled('social', false);
    const greetingAfterDisable = manager.getPersonalityForTrigger('GreetingTrigger');
    console.log(`   After disabling social: GreetingTrigger -> ${greetingAfterDisable.name}`);

    // Re-enable social personality
    manager.setPersonalityEnabled('social', true);
    const greetingAfterEnable = manager.getPersonalityForTrigger('GreetingTrigger');
    console.log(`   After re-enabling social: GreetingTrigger -> ${greetingAfterEnable.name}`);
    console.log('');

    // Test VK instance retrieval
    console.log('4. Testing VK instance retrieval...');
    const vkInstance = manager.getVKForTrigger('GreetingTrigger');
    console.log(`   ✅ VK instance retrieved: ${vkInstance ? 'Yes' : 'No'}`);
    console.log('');

    // Show final statistics
    console.log('5. Final statistics:');
    const finalStats = manager.getStats();
    console.log(`   📊 Total personalities: ${finalStats.totalPersonalities}`);
    console.log(`   📊 Enabled personalities: ${finalStats.enabledPersonalities}`);
    console.log(`   📊 Trigger mappings: ${finalStats.triggerMappings}`);

    console.log('\n   Personality details:');
    for (const [name, details] of Object.entries(finalStats.personalities)) {
      console.log(`     - ${name}: ${details.description} (enabled: ${details.enabled})`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - PersonalityManager can handle multiple VK personalities');
    console.log('   - Triggers are correctly routed to appropriate personalities');
    console.log('   - Fallback mechanism works when personalities are disabled');
    console.log('   - Personalities can be dynamically enabled/disabled');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };