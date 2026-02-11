const { DateTime } = require('luxon');
const fs = require('fs');

/**
 * Test script to verify the greet-friends state management logic
 * This simulates the state checking logic without actually sending messages
 */

function testGreetingStateLogic() {
  console.log('Testing greeting state management logic...\n');

  // Simulate the state structure
  const states = {};
  const triggerName = 'GreetingTrigger';
  const friendId = 12345;

  // Test 1: First time greeting a friend (no state exists)
  console.log('Test 1: First time greeting a friend');
  states[friendId] = states[friendId] || {};
  const friendState = states[friendId];
  const triggers = friendState.triggers ??= {};
  const greetingTriggerState = triggers[triggerName] ??= {};
  const lastTriggered = greetingTriggerState.lastTriggered;
  const now = DateTime.now();
  const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;

  console.log(`  Friend ID: ${friendId}`);
  console.log(`  Last triggered: ${lastTriggered || 'never'}`);
  console.log(`  Days since last greeting: ${lastTriggeredDiff}`);
  console.log(`  Should send greeting: ${lastTriggeredDiff >= 1}`);

  if (lastTriggeredDiff >= 1) {
    greetingTriggerState.lastTriggered = now;
    console.log(`  ✅ Greeting would be sent and state updated`);
  }

  console.log('\n');

  // Test 2: Immediate second attempt (should be blocked)
  console.log('Test 2: Immediate second attempt');
  const lastTriggered2 = greetingTriggerState.lastTriggered;
  const lastTriggeredDiff2 = lastTriggered2 ? now.diff(lastTriggered2, 'days').days : Number.MAX_SAFE_INTEGER;

  console.log(`  Friend ID: ${friendId}`);
  console.log(`  Last triggered: ${lastTriggered2}`);
  console.log(`  Days since last greeting: ${lastTriggeredDiff2.toFixed(6)}`);
  console.log(`  Should send greeting: ${lastTriggeredDiff2 >= 1}`);

  if (lastTriggeredDiff2 >= 1) {
    console.log(`  ✅ Greeting would be sent`);
  } else {
    console.log(`  ❌ Greeting blocked - already sent today`);
  }

  console.log('\n');

  // Test 3: Simulate next day
  console.log('Test 3: Next day attempt');
  const tomorrow = DateTime.now().plus({ days: 1 });
  const lastTriggeredDiff3 = lastTriggered2 ? tomorrow.diff(lastTriggered2, 'days').days : Number.MAX_SAFE_INTEGER;

  console.log(`  Friend ID: ${friendId}`);
  console.log(`  Last triggered: ${lastTriggered2}`);
  console.log(`  Current time (simulated): ${tomorrow}`);
  console.log(`  Days since last greeting: ${lastTriggeredDiff3.toFixed(2)}`);
  console.log(`  Should send greeting: ${lastTriggeredDiff3 >= 1}`);

  if (lastTriggeredDiff3 >= 1) {
    console.log(`  ✅ Greeting would be sent - enough time has passed`);
  } else {
    console.log(`  ❌ Greeting blocked`);
  }

  console.log('\n');

  // Test state persistence
  console.log('Test 4: State persistence simulation');
  const stateJson = JSON.stringify(states, null, 2);
  console.log('State that would be saved to file:');
  console.log(stateJson);

  // Verify the state can be parsed back
  const parsedStates = JSON.parse(stateJson);
  console.log('\nState successfully parsed back from JSON ✅');

  return true;
}

if (require.main === module) {
  testGreetingStateLogic();
}

module.exports = { testGreetingStateLogic };