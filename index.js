const fs = require('fs');
const { VK } = require('vk-io');

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const queue = [];

const greetings = [
  "Hi",
  "Hello",
  "Hey there",
  "Good day",
  "Howdy",
  "Salutations",
  "Greetings",
  "What's up",
  "Aloha",
  "Bonjour",
  "Hola",
  "Ciao",
  "Привет",
  "Здравствуй",
  "Добрый день",
  "Hallo",
  "Hej",
  "Salut",
  "Merhaba",
  "你好",
  "こんにちは",
  "नमस्ते",
];

function getRandomGreeting() {
  return greetings[Math.floor(Math.random()*greetings.length)];
}

function enqueueMessage(options) {
  queue.push({
    wait: randomInRange(2, 10),
    ...options
  });
}

fs.readFile('token', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  
  const vk = new VK({
    token: data
  });

  vk.updates.on(['message_new'], (request) => {
    console.log('request', JSON.stringify(request, null, 2));
    
    if (request.text && request.text.toLowerCase() == 'react-with-sticker') {
      enqueueMessage({
        request,
        response: {
          user_id: 3972090,
          sticker_id: 72789,
          random_id: Math.random() // to make each message unique
        }
      });
    }
    if (request.text && request.text.toLowerCase() == 'react-with-hi') {
      enqueueMessage({
        request,
        response: {
          message: getRandomGreeting()
        }
      });
    }
  });

  vk.updates.start().catch(console.error);

  const messagesHandlerInterval = setInterval(() => {
    const context = queue[0];
    if (!context) { // no messages to send - to nothing
      return;
    }
    if (context.wait > 0) // we have a message to send - wait for the set interval
    {
      console.log('message.wait', context.wait);
      context.wait--;
      return;
    }
    queue.shift(); // dequeue message
    context.request.send(context.response); // send response within the request's context
  }, 1000);
})