const queue = [];

const tickSize = 1000;

const defaultTypingSpeedCharactersPerMinute = 300;
const defaultTypingSpeedCharactersPerSecond = defaultTypingSpeedCharactersPerMinute / 60;

const calculateMinimumSecondsToType = (text, speed = defaultTypingSpeedCharactersPerSecond) => {
  return Math.floor(text.length / speed);
};

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function randomInteger() {
  return randomInRange(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
}

function enqueueMessage(options) {
  let defaultOptions = {
    ticksToTyping: randomInRange(1, 4),
    maxWaitTicks: randomInRange(3, 7),
  };
  if (options?.response?.sticker_id) {
    defaultOptions.ticksToTyping = 10;
    defaultOptions.maxWaitTicks = randomInRange(2, 5);
  } else if (options?.response?.message) {
    defaultOptions.maxWaitTicks += calculateMinimumSecondsToType(options?.response?.message);
  }
  const combinedOptions = {
    ...defaultOptions,
    ...options
  };
  if (!combinedOptions?.response?.random_id) {
    combinedOptions.response.random_id = randomInteger();
    console.log('combinedOptions.response.random_id', options.response.random_id)
  }
  if (!combinedOptions.waitTicksLeft) {
    combinedOptions.waitTicksLeft = combinedOptions.maxWaitTicks;
  }
  queue.push(combinedOptions);
}

const handleOutgoingMessage = async () => {
  const context = queue[0];
  if (!context) { // no messages to send - to nothing
    return;
  }
  if (context.waitTicksLeft > 0) // we have a message to send - wait for the set interval
  {
    const ticksPassed = context.maxWaitTicks - context.waitTicksLeft;
    console.log('context.ticksToTyping', context.ticksToTyping);
    console.log('ticksPassed', ticksPassed);
    console.log('context.ticksToTyping >= ticksPassed', ticksPassed >= context.ticksToTyping);
    console.log('((ticksPassed - context.ticksToTyping) % 5 == 0)', ((ticksPassed - context.ticksToTyping) % 5 == 0));
    if (ticksPassed >= context.ticksToTyping && ((ticksPassed - context.ticksToTyping) % 5 == 0)) {
      const peerId = context?.request?.peerId;
      if (peerId && context.vk) {
        console.log('typing status starting request');
        await context.vk.api.messages.setActivity({
          peer_id: peerId,
          type: 'typing'
        });
        console.log('typing status request completed');
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

module.exports = {
  queue,
  tickSize,
  defaultTypingSpeedCharactersPerMinute,
  defaultTypingSpeedCharactersPerSecond,
  calculateMinimumSecondsToType,
  randomInRange,
  handleOutgoingMessage,
  enqueueMessage
};