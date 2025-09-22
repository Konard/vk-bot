// Test script to verify the greeting trigger import works correctly
// This addresses issue #61: TypeError: Cannot read properties of undefined (reading 'action') at greetOnlineFriends

console.log('Testing greeting trigger import...');

try {
  const { trigger: greetingTrigger } = require('../triggers/greeting');

  console.log('✓ Import successful');
  console.log('greetingTrigger:', typeof greetingTrigger);
  console.log('greetingTrigger.action:', typeof greetingTrigger?.action);
  console.log('greetingTrigger.name:', greetingTrigger?.name);

  if (greetingTrigger && typeof greetingTrigger.action === 'function') {
    console.log('✓ greetingTrigger.action is a function');
  } else {
    console.log('✗ greetingTrigger.action is not available or not a function');
  }
} catch (error) {
  console.error('✗ Import failed:', error.message);
  console.error('Error details:', error);
}