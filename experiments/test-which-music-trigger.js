// Test script to verify the which-music-do-you-listen trigger can be loaded
const { trigger } = require('../triggers/which-music-do-you-listen');

console.log('Trigger loaded successfully:');
console.log('Name:', trigger.name);
console.log('Action function:', typeof trigger.action);

// Test that the trigger exports correctly
if (trigger.name === 'WhichMusicDoYouListen' && typeof trigger.action === 'function') {
  console.log('✅ Trigger module is valid');
} else {
  console.log('❌ Trigger module has issues');
}