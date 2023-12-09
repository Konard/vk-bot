const queue = [];

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function enqueueMessage(options) {
  queue.push({
    wait: randomInRange(3, 7),
    ...options
  });
}

const handleOutgoingMessage = async () => {
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
  if (context.request) {
    await context.request.send(context.response); // send response within the request's context
  } else if (context.vk) {
    await context.vk.api.messages.send({
      random_id: Math.random(),
      ...context.response
    }); 
  }
};

module.exports = { randomInRange, handleOutgoingMessage, enqueueMessage }