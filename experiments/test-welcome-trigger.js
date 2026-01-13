// Simple test to verify the welcome trigger can be loaded and has correct structure
const { trigger } = require('../triggers/welcome-new-friends');

console.log('Testing welcome-new-friends trigger...');

// Check if trigger is properly exported
if (!trigger) {
  console.error('❌ Trigger not found!');
  process.exit(1);
}

// Check if trigger has required properties
if (!trigger.name) {
  console.error('❌ Trigger name not found!');
  process.exit(1);
}

if (!trigger.action) {
  console.error('❌ Trigger action not found!');
  process.exit(1);
}

if (typeof trigger.action !== 'function') {
  console.error('❌ Trigger action is not a function!');
  process.exit(1);
}

console.log('✅ Trigger structure is valid');
console.log(`✅ Trigger name: ${trigger.name}`);
console.log('✅ Trigger action is a function');
console.log('✅ Welcome trigger test passed!');