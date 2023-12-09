const fs = require('fs');
const { VK } = require('vk-io');

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const queue = [];

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
    if (request.text && request.text.toLowerCase() == 'hi') {
      enqueueMessage({
        request,
        response: {
          message: 'Hello!'
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