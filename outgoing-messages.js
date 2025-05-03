const pendingSendQueue = [];
const completeSendQueue = [];

const tickSize = 1000; // ms

const typingSpeedInCharactersPerMinute = 450;
const typingSpeedInCharactersPerSecond = typingSpeedInCharactersPerMinute / 60;

const typingInterval = 5;

const minTicksToRead = 2;
const maxTicksToRead = 4;

const minTicksToTyping = 6;
const maxTicksToTyping = 8;

const minTicksToSticker = 6;
const maxTicksToSticker = 8;

const minTicksToReply = 10;
const maxTicksToReply = 14;

if (maxTicksToRead > minTicksToTyping)
{
  throw new Error('maxTicksToRead > minTicksToTyping')
}
if (maxTicksToRead > minTicksToSticker)
{
  throw new Error('maxTicksToRead > minTicksToSticker')
}
if (maxTicksToTyping > minTicksToReply)
{
  throw new Error('maxTicksToTyping > minTicksToReply')
}

const calculateMinimumSecondsToType = (text, speed = typingSpeedInCharactersPerSecond) => {
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

async function activateTyping(context) {
  const peerId = context?.request?.peerId;
  if (peerId && context.vk) {
    console.log('Activating typing status...');
    await context.vk.api.messages.setActivity({
      peer_id: peerId,
      type: 'typing'
    });
    console.log('Typing status is activated.');
  }
}

function markMessagesAsRead(options) {
  if (!options?.vk || !options?.request) {
    return;
  }
  const timeout = randomInRange(minTicksToRead * tickSize, maxTicksToRead * tickSize);
  console.log(`Messages before ${options.request.id} for user ${options.request.senderId} will be marked as read in ${timeout}ms.`);
  setTimeout(async () => {
    await options.vk.api.messages.markAsRead({
      peer_id: options.request.senderId,
      start_message_id: options.request.id
    }).catch(console.error);
    console.log(`Messages before ${options.request.id} for user ${options.request.senderId} are marked as read.`);
  }, timeout);
}

function disableTypingIndication(options) {
  options.ticksToTyping = Number.MAX_SAFE_INTEGER;
}

function enqueueMessage(options) {
  let defaultOptions = {
    ticksToTyping: randomInRange(minTicksToTyping, maxTicksToTyping),
    waitTicks: randomInRange(minTicksToReply, maxTicksToReply),
  };
  if (options?.response?.sticker_id) {
    disableTypingIndication(options);
    defaultOptions.waitTicks = randomInRange(minTicksToSticker, maxTicksToSticker);
  } else if (options?.response?.message) {
    defaultOptions.waitTicks += calculateMinimumSecondsToType(options?.response?.message);
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
    combinedOptions.waitTicksLeft = combinedOptions.waitTicks;
  }
  pendingSendQueue.push(combinedOptions);
  markMessagesAsRead(options);
}

async function sendMessage(context) {
  const awaitTimeoutMs = context?.options?.awaitTimeoutMs || (120 * 1000);
  enqueueMessage({ 
    ...context,
    awaited: true,
  });
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (completeSendQueue.length > 0) {
        const completedMessageSend = completeSendQueue.shift();
        clearInterval(interval);
        resolve(completedMessageSend);
      }
    }, tickSize);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Timeout waiting for message send'));
    }, awaitTimeoutMs);
  });
}

const handleOutgoingMessage = async () => {
  const context = pendingSendQueue[0];
  if (!context) { // no messages to send - to nothing
    return;
  }
  if (context.waitTicksLeft > 0) // we have a message to send - wait for the set interval
  {
    const ticksPassed = context.waitTicks - context.waitTicksLeft;
    // console.log('context.ticksToTyping', context.ticksToTyping);
    console.log('ticksPassed', ticksPassed);
    // console.log('context.ticksToTyping >= ticksPassed', ticksPassed >= context.ticksToTyping);
    // console.log('((ticksPassed - context.ticksToTyping) % typingInterval == 0)', ((ticksPassed - context.ticksToTyping) % typingInterval == 0));
    if (ticksPassed >= context.ticksToTyping && ((ticksPassed - context.ticksToTyping) % typingInterval == 0)) {
      await activateTyping(context);
    }
    // console.log('context.waitTicksLeft', context.waitTicksLeft);
    context.waitTicksLeft--;
    return;
  }
  pendingSendQueue.shift(); // dequeue message
  console.log('context.request', context.response);
  console.log('context.response', context.response);

  let sendResponse = null;

  try {
    if (context.request) {
      sendResponse = await context.request.send(context.response);
    } else if (context.vk) {
      sendResponse = await context.vk.api.messages.send({
        random_id: Math.random(),
        ...context.response
      });
    }
  } catch (e) {
    const userId = e.params.find((param) => param.key === 'user_id')?.value || context?.response?.user_id || context?.request?.peerId;
    if (e.code === 900) { // Can't send messages for users from blacklist
      console.log(`${userId} user is blocked from sending messages to him.`);
      return; // This error requires to do nothing.
    } else if (e.code === 902) { // Can't send messages to this user due to their privacy settings
      console.log(`${userId} user does not allow to send messages to him.`);
      return; // This error requires to do nothing.
      // TODO: unfriend or block user if he blocked you
    } else if (e.code === 7) { // Permission to perform this action is denied
      console.log(`${userId} user is deactivated (blocked or deleted) or limit reached.`);
      return; // This error requires to do nothing.
      // TODO: unfriend of it is deactivated, block if he blocked you or just wait on the limit
    } else {
      throw e;
    }
  }
  if (context.awaited) {
    const completedMessageSend = {
      request: context,
      response: sendResponse
    };
    completeSendQueue.push(completedMessageSend);
  }
};

module.exports = {
  queue: pendingSendQueue,
  tickSize,
  typingSpeedInCharactersPerMinute,
  typingSpeedInCharactersPerSecond,
  calculateMinimumSecondsToType,
  randomInRange,
  handleOutgoingMessage,
  enqueueMessage,
  sendMessage,
};