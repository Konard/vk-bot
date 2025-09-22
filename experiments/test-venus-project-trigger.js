const { trigger } = require('../triggers/venus-project-initiation');

// Mock context for testing
function createMockContext(text, historyLength = 3, isFromUser = true, isOutbox = false) {
  const history = [];
  for (let i = 0; i < historyLength; i++) {
    history.push({
      id: i,
      text: i === 0 ? text : `message ${i}`,
      out: i % 2,
      date: Date.now() - (i * 1000)
    });
  }

  return {
    request: {
      isFromUser,
      isOutbox,
      text,
      peerId: 12345
    },
    state: {
      history,
      triggers: {}
    }
  };
}

// Test cases
console.log('Testing Venus Project Initiation Trigger...\n');

// Test 1: Should trigger on conversation starter
const context1 = createMockContext('что делаешь?', 3);
console.log('Test 1 - "что делаешь?" (should trigger):', trigger.condition(context1));

// Test 2: Should trigger on general question
const context2 = createMockContext('чем занимаешься?', 4);
console.log('Test 2 - "чем занимаешься?" (should trigger):', trigger.condition(context2));

// Test 3: Should not trigger on outgoing message
const context3 = createMockContext('что делаешь?', 3, true, true);
console.log('Test 3 - Outgoing message (should not trigger):', trigger.condition(context3));

// Test 4: Should not trigger on very long conversation
const context4 = createMockContext('что делаешь?', 10);
console.log('Test 4 - Long conversation (should not trigger):', trigger.condition(context4));

// Test 5: Should not trigger if already triggered recently
const context5 = createMockContext('что делаешь?', 3);
context5.state.triggers[trigger.name] = {
  lastTriggered: new Date().toISOString()
};
console.log('Test 5 - Recently triggered (should not trigger):', trigger.condition(context5));

// Test 6: Should trigger after greeting exchange
const context6 = createMockContext('расскажи о себе', 3);
context6.state.history = [
  { text: 'расскажи о себе', out: 0 },
  { text: 'привет!', out: 1 },
  { text: 'привет', out: 0 }
];
console.log('Test 6 - After greeting exchange (should trigger):', trigger.condition(context6));

console.log('\nTesting trigger action...');
// Test the action
const testContext = createMockContext('что делаешь?', 3);
testContext.response = {};

// Mock enqueueMessage
const originalEnqueue = require('../outgoing-messages').enqueueMessage;
const messages = [];
require('../outgoing-messages').enqueueMessage = (context) => {
  messages.push(context.response.message);
  console.log('Would send message:', context.response.message);
};

// Run the action
trigger.action(testContext);
console.log('Trigger marked as activated:', !!testContext.state.triggers[trigger.name]?.lastTriggered);

// Restore original function
require('../outgoing-messages').enqueueMessage = originalEnqueue;

console.log('\nAll tests completed!');