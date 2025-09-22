const { second } = require('../time-units');

// Mock the typing cooldown logic from outgoing-messages.js
const typingCooldowns = new Map();
const minTypingCooldown = 10 * second; // 10 seconds minimum

function canActivateTyping(peerId) {
  const now = Date.now();
  const lastTypingTime = typingCooldowns.get(peerId) || 0;

  if (now - lastTypingTime < minTypingCooldown) {
    const remainingTime = Math.round((minTypingCooldown - (now - lastTypingTime)) / 1000);
    console.log(`Rate limiting active for peer ${peerId}, ${remainingTime}s remaining`);
    return false;
  }

  typingCooldowns.set(peerId, now);
  console.log(`Typing allowed for peer ${peerId}`);
  return true;
}

// Test the rate limiting
const testPeerId = 12345;

console.log('=== Testing typing rate limiting ===');
console.log('1. First call should be allowed:');
canActivateTyping(testPeerId);

console.log('\n2. Immediate second call should be blocked:');
canActivateTyping(testPeerId);

console.log('\n3. Third call after 5 seconds should still be blocked:');
setTimeout(() => {
  canActivateTyping(testPeerId);
}, 5000);

console.log('\n4. Fourth call after 11 seconds should be allowed:');
setTimeout(() => {
  canActivateTyping(testPeerId);
}, 11000);

console.log('\nTest will complete in 12 seconds...');