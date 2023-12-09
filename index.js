const fs = require('fs');
const { VK } = require('vk-io');

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const queue = [];

const greetingRegex = /^\s*(привет|здравствуй|здравствуйте|добрый день|доброе утро|добрый вечер)\s*[.?!]*\s*$/gi;

const greetings = [
  "Привет",
  "Здравствуй",
  "Здравствуйте",
];

const stickers = [
  72789,
  3003,
  76459,
  73071,
  51417,
  72437,
  69175,
  4639,
  14409,
  21,
  75306,
  73151,
  77664,
  60062,
  134,
  4917,
  15346
];

function getRandomGreeting() {
  return greetings[Math.floor(Math.random()*greetings.length)];
}

function getRandomSticker() {
  return stickers[Math.floor(Math.random()*stickers.length)];
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
    if (context.isGroup) {
      return;
    }

    console.log('request', JSON.stringify(request, null, 2));

    if (greetingRegex.test(request.text)) {
      enqueueMessage({
        request,
        response: {
          sticker_id: getRandomSticker(),
          random_id: Math.random() // to make each message unique
        }
      });
    }
    // if (request.text && request.text.toLowerCase() == 'react-with-hi') {
    //   enqueueMessage({
    //     request,
    //     response: {
    //       message: getRandomGreeting()
    //     }
    //   });
    // }
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
    console.log('response', context.response);
    context.request.send(context.response); // send response within the request's context
  }, 1000);
})