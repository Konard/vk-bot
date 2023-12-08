const fs = require('fs');
const { VK } = require('vk-io');

fs.readFile('token', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  
  const vk = new VK({
    token: data
  });

  vk.updates.on(['message_new'], (context) => {
    if (context.text && context.text.toLowerCase() == 'hi') {
        context.send('Hello!');
    }
  });

  vk.updates.start().catch(console.error);
})