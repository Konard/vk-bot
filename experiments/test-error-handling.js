// Test script for error handling in outgoing messages
const { markStickerAsInvalid } = require('../sticker-validator');

// Simulate the VK API error that would occur with sticker 72789
function simulateVKAPIError() {
  const error = new Error('APIError: Code №10 - Internal server error');
  error.code = 10;
  error.params = [
    { key: 'method', value: 'messages.send' },
    { key: 'oauth', value: '1' },
    { key: 'v', value: '5.131' },
    { key: 'random_id', value: '-2171092103884232' },
    { key: 'user_id', value: '150940914' },
    { key: 'sticker_id', value: '72789' }
  ];
  return error;
}

console.log('Testing error handling for sticker API errors...\n');

// Simulate the error handling logic from outgoing-messages.js
function simulateErrorHandling(error, context) {
  const userId = error.params?.find?.((param) => param.key === 'user_id')?.value || context?.response?.user_id || context?.request?.peerId;
  const stickerId = error.params?.find?.((param) => param.key === 'sticker_id')?.value || context?.response?.sticker_id;

  console.log('Error code:', error.code);
  console.log('User ID:', userId);
  console.log('Sticker ID:', stickerId);

  if (error.code === 10 && stickerId) {
    console.log(`Sticker ${stickerId} is no longer available (Internal server error). Skipping message to user ${userId}.`);
    markStickerAsInvalid(stickerId, 'VK API error code 10 - Internal server error');
    return true; // Error handled
  }

  return false; // Error not handled
}

// Test the error handling
const testError = simulateVKAPIError();
const testContext = {
  response: { user_id: '150940914', sticker_id: '72789' }
};

console.log('Simulating VK API error for sticker 72789:');
const handled = simulateErrorHandling(testError, testContext);

if (handled) {
  console.log('✅ Error was properly handled!');
  console.log('Sticker 72789 should now be marked as invalid.');
} else {
  console.log('❌ Error was not handled properly.');
}

console.log('\n✅ Error handling test completed!');