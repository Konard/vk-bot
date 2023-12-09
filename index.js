const fs = require('fs');
const { VK } = require('vk-io');

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const messagesQueue = [];
let intervalsToMessage = 0;

function increaseInterval() {
  const randomNumber = randomInRange(2, 10);
  console.log('increaseInterval', 'randomNumber', randomNumber);
  intervalsToMessage += randomNumber;
  console.log('increaseInterval', 'intervalsToMessage', intervalsToMessage);
}

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
    increaseInterval();
    messagesQueue.push(context);
    console.log('context', JSON.stringify(context, null, 2));
  });

  vk.updates.start().catch(console.error);

  const messagesHandlerInterval = setInterval(() => {
    if (intervalsToMessage > 0)
    {
      console.log('intervalsToMessage', intervalsToMessage);
      intervalsToMessage--;
      return;
    }
    const message = messagesQueue.shift();
    if (!message) {
      return;
    }
    if (message.text && message.text.toLowerCase() == 'hi') {
      message.send('Hello!');
      increaseInterval();
    }
  }, 1000);
})