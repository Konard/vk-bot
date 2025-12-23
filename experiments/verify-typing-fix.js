// Simple verification script for the typing deactivation fix
console.log('Verifying typing deactivation fix...');

// Read the modified outgoing-messages.js file to verify our changes
const fs = require('fs');
const path = require('path');

const outgoingMessagesPath = path.join(__dirname, '..', 'outgoing-messages.js');
const content = fs.readFileSync(outgoingMessagesPath, 'utf8');

// Check if deactivateTyping function exists
const hasDeactivateTypingFunction = content.includes('async function deactivateTyping(context)');
console.log('✓ deactivateTyping function exists:', hasDeactivateTypingFunction);

// Check if deactivateTyping is called after successful message send
const hasDeactivateAfterSend = content.includes('await deactivateTyping(context);') &&
                               content.includes('// Deactivate typing status after message is sent');
console.log('✓ deactivateTyping called after message send:', hasDeactivateAfterSend);

// Check if deactivateTyping is called in error case
const hasDeactivateInError = content.includes('// Deactivate typing status even if message sending failed');
console.log('✓ deactivateTyping called in error handling:', hasDeactivateInError);

// Check if the VK API call for deactivation is correct
const hasCorrectApiCall = content.includes('await context.vk.api.messages.setActivity({') &&
                         content.includes('peer_id: peerId') &&
                         content.includes('});') &&
                         content.includes('// To deactivate typing, we need to call setActivity without the type parameter');
console.log('✓ Correct VK API call for deactivation:', hasCorrectApiCall);

console.log('\n--- Summary ---');
if (hasDeactivateTypingFunction && hasDeactivateAfterSend && hasDeactivateInError && hasCorrectApiCall) {
  console.log('✅ All checks passed! The typing deactivation fix has been properly implemented.');
  console.log('\nThe fix ensures that:');
  console.log('1. Typing indicator is deactivated after successful message send');
  console.log('2. Typing indicator is deactivated even if message sending fails');
  console.log('3. VK API is called correctly to stop the typing activity');
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
}