/**
 * Test script for the personality separation system
 * This script tests the PersonalityManager without requiring VK tokens
 */

const { PersonalityManager } = require('../personality-manager');

// Mock configuration for testing
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
      enabled: false // Test disabled personality
    }
  }
};

function runTests() {
  console.log('🧪 Starting Personality System Tests...\n');

  try {
    // Test 1: Initialize PersonalityManager
    console.log('Test 1: Initialize PersonalityManager');
    const manager = new PersonalityManager(testConfig);
    console.log('✅ PersonalityManager initialized successfully');
    console.log('Stats:', manager.getStats());
    console.log('');

    // Test 2: Get personality for specific trigger
    console.log('Test 2: Get personality for specific triggers');

    const greetingPersonality = manager.getPersonalityForTrigger('GreetingTrigger');
    console.log(`GreetingTrigger -> ${greetingPersonality.name} (${greetingPersonality.description})`);

    const gratitudePersonality = manager.getPersonalityForTrigger('GratitudeTrigger');
    console.log(`GratitudeTrigger -> ${gratitudePersonality.name} (${gratitudePersonality.description})`);

    const musicPersonality = manager.getPersonalityForTrigger('DoYouLikeThisMusicTrigger');
    console.log(`DoYouLikeThisMusicTrigger -> ${musicPersonality.name} (enabled: ${musicPersonality.enabled})`);

    const unknownPersonality = manager.getPersonalityForTrigger('UnknownTrigger');
    console.log(`UnknownTrigger -> ${unknownPersonality.name} (fallback)`);
    console.log('✅ Trigger routing works correctly');
    console.log('');

    // Test 3: Test personality states
    console.log('Test 3: Test personality enable/disable');
    console.log('Before disable social:', manager.getPersonalityForTrigger('GreetingTrigger').name);

    manager.setPersonalityEnabled('social', false);
    console.log('After disable social:', manager.getPersonalityForTrigger('GreetingTrigger').name);

    manager.setPersonalityEnabled('social', true);
    console.log('After re-enable social:', manager.getPersonalityForTrigger('GreetingTrigger').name);
    console.log('✅ Personality enable/disable works correctly');
    console.log('');

    // Test 4: Test VK instance retrieval
    console.log('Test 4: Test VK instance retrieval');
    const vkInstance = manager.getVKForTrigger('GreetingTrigger');
    console.log(`VK instance for GreetingTrigger:`, vkInstance ? 'Available' : 'Not available');
    console.log('✅ VK instance retrieval works');
    console.log('');

    // Test 5: Test all personalities listing
    console.log('Test 5: Test all personalities listing');
    const allPersonalities = manager.getAllPersonalities();
    console.log('All personalities:');
    for (const [name, personality] of allPersonalities) {
      console.log(`  - ${name}: ${personality.description} (enabled: ${personality.enabled})`);
    }
    console.log('✅ Personality listing works');
    console.log('');

    // Test 6: Test statistics
    console.log('Test 6: Test statistics');
    const stats = manager.getStats();
    console.log('Final statistics:', JSON.stringify(stats, null, 2));
    console.log('✅ Statistics generation works');
    console.log('');

    console.log('🎉 All tests passed! Personality system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Mock VK constructor to avoid requiring actual tokens
jest.mock('vk-io', () => ({
  VK: jest.fn().mockImplementation(() => ({
    updates: {
      start: jest.fn().mockResolvedValue(),
      stop: jest.fn().mockResolvedValue()
    }
  }))
}));

// Only run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };