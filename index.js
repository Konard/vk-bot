const { VK } = require('vk-io');

const vk = new VK({
   token: 'your_access_token_here'
});

vk.updates.on(['message_new'], (context) => {
   if (context.text && context.text.toLowerCase() == 'hi') {
       context.send('Hello!');
   }
});

vk.updates.start().catch(console.error);