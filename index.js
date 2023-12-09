const fs = require('fs');
const { VK } = require('vk-io');

const messagesQueue = [];

fs.readFile('token', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  
  const vk = new VK({
    token: data
  });

  vk.updates.on(['message_new'], (context) => {
    console.log('context.text', context.text);
    messagesQueue.push(context);
  });

  vk.updates.start().catch(console.error);

  const messagesHandlerInterval = setInterval(() => {
    const message = messagesQueue.shift();
    if (!message) {
      return;
    }
    if (message.text && message.text.toLowerCase() == 'hi') {
      message.send('Hello!');
    }
  }, 1000);
})