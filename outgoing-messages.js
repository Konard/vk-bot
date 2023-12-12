const queue = [];

const tickSize = 1000;

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function enqueueMessage(options) {
  const maxWaitTicks = randomInRange(3, 7);
  queue.push({
    maxWaitTicks,
    waitTicksLeft: maxWaitTicks,
    ...options
  });
}

const handleOutgoingMessage = async () => {
  const context = queue[0];
  if (!context) { // no messages to send - to nothing
    return;
  }
  if (context.waitTicksLeft > 0) // we have a message to send - wait for the set interval
  {
    const ticksPassed = context.maxWaitTicks - context.waitTicksLeft;
    console.log('ticksPassed', ticksPassed);
    if (ticksPassed % 5 == 0) {
      const peerId = context?.request?.peerId;
      if (peerId && context.vk) {
        await context.vk.api.messages.setActivity({
          peer_id: peerId,
          type: 'typing'
        });
      }
    }
    console.log('context.waitTicksLeft', context.waitTicksLeft);
    context.waitTicksLeft--;
    return;
  }
  queue.shift(); // dequeue message
  console.log('context.request', context.response);
  console.log('context.response', context.response);
  try {
    if (context.request) {
      await context.request.send(context.response); // send response within the request's context
    } else if (context.vk) {
      await context.vk.api.messages.send({
        random_id: Math.random(),
        ...context.response
      }); 
    }
  } catch (e) {
    if (e.code === 902) { // Can't send messages to this user due to their privacy settings
      return; // This error requires to do nothing.
    } else {
      throw e;
    }
  }
};

module.exports = { randomInRange, handleOutgoingMessage, enqueueMessage, tickSize }