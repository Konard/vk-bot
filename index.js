const fs = require('fs');
const { VK } = require('vk-io');

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

const messagesQueue = [];
const intervalsToMessage = 5;

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
    if (intervalsToMessage > 0)
    {
      intervalsToMessage--;
      return;
    }
    if (!message) {
      return;
    }
    if (message.text && message.text.toLowerCase() == 'hi') {
      message.send('Hello!');
    }
    const randomNumber = randomInRange(2, 10);
    console.log('randomNumber', randomNumber);
    intervalsToMessage += randomNumber;
    console.log('intervalsToMessage', intervalsToMessage);
  }, 1000);
})