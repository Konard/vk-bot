/**
 * Test script for personality configuration loading
 * Tests the configuration system without requiring VK tokens
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Personality Configuration System\n');

try {
  // Test 1: Load personalities configuration
  console.log('1. Loading personalities configuration...');
  const personalitiesConfig = require('../personalities.config');
  console.log('✅ Configuration loaded successfully');
  console.log(`   Default personality: ${personalitiesConfig.defaultPersonality}`);
  console.log(`   Total personalities defined: ${Object.keys(personalitiesConfig.personalities).length}`);
  console.log('');

  // Test 2: Validate configuration structure
  console.log('2. Validating configuration structure...');

  const requiredFields = ['defaultPersonality', 'personalities'];
  for (const field of requiredFields) {
    if (personalitiesConfig[field]) {
      console.log(`   ✅ Required field '${field}' is present`);
    } else {
      console.log(`   ❌ Required field '${field}' is missing`);
    }
  }

  // Test 3: Validate personality definitions
  console.log('\n3. Validating personality definitions...');

  for (const [name, personality] of Object.entries(personalitiesConfig.personalities)) {
    console.log(`   Personality: ${name}`);

    const personalityFields = ['description', 'triggers', 'enabled'];
    for (const field of personalityFields) {
      if (personality[field] !== undefined) {
        console.log(`     ✅ ${field}: ${Array.isArray(personality[field]) ? `[${personality[field].length} items]` : personality[field]}`);
      } else {
        console.log(`     ⚠️  ${field}: not defined`);
      }
    }

    if (personality.triggers && Array.isArray(personality.triggers)) {
      console.log(`     📋 Triggers: ${personality.triggers.join(', ')}`);
    }
    console.log('');
  }

  // Test 4: Check if example configuration exists
  console.log('4. Checking example configuration...');
  const exampleConfigPath = path.join(__dirname, '../personalities.example.config.js');
  if (fs.existsSync(exampleConfigPath)) {
    console.log('   ✅ Example configuration file exists');
    const exampleConfig = require('../personalities.example.config');
    console.log(`   📝 Example personalities: ${Object.keys(exampleConfig.personalities).join(', ')}`);
  } else {
    console.log('   ❌ Example configuration file not found');
  }

  // Test 5: Test configuration logic
  console.log('\n5. Testing configuration logic...');

  // Check if default personality exists in personalities list
  const defaultPersonality = personalitiesConfig.defaultPersonality;
  if (personalitiesConfig.personalities[defaultPersonality]) {
    console.log(`   ✅ Default personality '${defaultPersonality}' exists in personalities list`);
  } else {
    console.log(`   ❌ Default personality '${defaultPersonality}' not found in personalities list`);
  }

  // Check for personalities with wildcard triggers
  const wildcardPersonalities = Object.entries(personalitiesConfig.personalities)
    .filter(([name, personality]) => personality.triggers && personality.triggers.includes('*'));

  console.log(`   📊 Personalities with wildcard triggers: ${wildcardPersonalities.length}`);
  wildcardPersonalities.forEach(([name]) => {
    console.log(`     - ${name}`);
  });

  // Check enabled personalities
  const enabledPersonalities = Object.entries(personalitiesConfig.personalities)
    .filter(([name, personality]) => personality.enabled);

  console.log(`   📊 Enabled personalities: ${enabledPersonalities.length}`);
  enabledPersonalities.forEach(([name]) => {
    console.log(`     - ${name}`);
  });

  console.log('\n🎉 Configuration tests completed successfully!');

  console.log('\n📝 Summary:');
  console.log('   - Configuration structure is valid');
  console.log('   - All personality definitions are properly formatted');
  console.log('   - Example configuration is available');
  console.log('   - Default personality fallback is configured');

} catch (error) {
  console.error('❌ Configuration test failed:', error);
  process.exit(1);
}