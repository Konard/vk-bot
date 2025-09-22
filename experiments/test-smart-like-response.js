const { trigger } = require('../triggers/smart-auto-like-response');

// Mock context for testing
function createMockContext(text, history = []) {
  return {
    request: {
      isFromUser: true,
      isOutbox: false,
      text: text,
      senderId: 12345,
      peerId: 12345,
    },
    state: {
      history: history
    },
    vk: {
      api: {
        messages: {}
      }
    }
  };
}

// Test cases
const testCases = [
  // Like patterns
  { text: "Мне нравится эта музыка", expected: true, type: "like" },
  { text: "Это прикольно!", expected: true, type: "like" },
  { text: "Лайк!", expected: true, type: "like" },
  { text: "Супер классно", expected: true, type: "like" },
  { text: "Круто получилось", expected: true, type: "like" },

  // Dislike patterns
  { text: "Мне не нравится", expected: true, type: "dislike" },
  { text: "Это отстой", expected: true, type: "dislike" },
  { text: "Плохо сделано", expected: true, type: "dislike" },
  { text: "Ужасно", expected: true, type: "dislike" },

  // Mixed patterns
  { text: "Раньше мне нравилось, но сейчас не нравится", expected: true, type: "mixed" },

  // No patterns
  { text: "Привет как дела", expected: false },
  { text: "Что делаешь?", expected: false },
  { text: "Спасибо за помощь", expected: false },

  // Edge cases
  { text: "", expected: false },
  { text: "Like a boss", expected: true, type: "like" },
];

console.log("Testing Smart Auto Like Response Trigger\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const context = createMockContext(testCase.text);
  const result = trigger.condition(context);

  const testPassed = result === testCase.expected;

  console.log(`Test ${index + 1}: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Text: "${testCase.text}"`);
  console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
  if (testCase.type) {
    console.log(`  Type: ${testCase.type}`);
  }
  console.log("");

  if (testPassed) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Test the action function with a mock enqueue
console.log("\n--- Testing Action Function ---");

let enqueuedMessages = [];

// Mock enqueueMessage
const originalEnqueue = require('../outgoing-messages').enqueueMessage;

// Create a simple mock for testing
const mockEnqueue = (options) => {
  enqueuedMessages.push({
    type: options.response.sticker_id ? 'sticker' : 'text',
    content: options.response.sticker_id || options.response.message,
    peerId: options.request?.peerId
  });
};

// Replace the enqueueMessage function temporarily
require('../outgoing-messages').enqueueMessage = mockEnqueue;

// Test action responses
const actionTests = [
  "Мне нравится эта песня",
  "Это отстой полный",
  "Супер классно сделано!",
  "Не нравится мне это"
];

actionTests.forEach((text, index) => {
  enqueuedMessages = []; // Reset
  const context = createMockContext(text);

  if (trigger.condition(context)) {
    trigger.action(context);
    console.log(`Action Test ${index + 1}: "${text}"`);
    console.log(`  Response:`, enqueuedMessages[0] || "No response");
    console.log("");
  }
});

// Restore original function
require('../outgoing-messages').enqueueMessage = originalEnqueue;

console.log("Testing completed!");