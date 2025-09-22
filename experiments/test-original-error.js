// Test script to reproduce the original error from issue #61
// TypeError: Cannot read properties of undefined (reading 'action') at greetOnlineFriends

console.log('Testing the exact scenario from the old greet-online-friends.js...');

try {
  // This is how the old script was importing the greeting trigger
  const { trigger: greetingTrigger } = require('../triggers/greeting');

  console.log('✓ Import successful');

  // This is line 44 from the old script that was causing the error
  if (greetingTrigger && greetingTrigger.action) {
    console.log('✓ greetingTrigger.action is available');
    console.log('✓ The TypeError would NOT occur now');
  } else {
    console.log('✗ greetingTrigger.action is undefined - this would cause the TypeError');
  }

  // Test calling the action (similar to how it was called on the original line 44)
  async function testGreetingAction() {
    try {
      // This is how the action was called in the original script
      const result = await greetingTrigger.action({
        vk: null, // We don't have a real VK instance for testing
        response: {
          user_id: 12345, // Test user ID
        }
      });
      console.log('✓ greetingTrigger.action call would succeed (if VK instance was available)');
    } catch (error) {
      if (error.message.includes('Cannot read property') || error.message.includes('Cannot read properties')) {
        console.log('✗ Still getting TypeError:', error.message);
      } else {
        console.log('✓ No TypeError in action call (other errors are expected without VK setup)');
      }
    }
  }

  testGreetingAction();

} catch (error) {
  console.error('✗ Import failed:', error.message);
  if (error.message.includes('Cannot read property') || error.message.includes('Cannot read properties')) {
    console.error('This is the same TypeError mentioned in issue #61');
  }
}