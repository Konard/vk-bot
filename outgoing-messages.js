const queue = [];

const tickSize = 1000; // ms

const typingSpeedInCharactersPerMinute = 400;
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
  queue.push(combinedOptions);
  markMessagesAsRead(options);
}

const handleOutgoingMessage = async () => {
  const context = queue[0];
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
  queue.shift(); // dequeue message
  console.log('context.request', context.response);
  console.log('context.response', context.response);
  try {
    if (context.request) {
      await context.request.send(context.response);
    } else if (context.vk) {
      await context.vk.api.messages.send({
        random_id: Math.random(),
        ...context.response
      });
    }
  } catch (e) {
    if (e.code === 900) { // Can't send messages for users from blacklist
      const peerId = context?.request?.peerId;
      console.log(`${peerId} peer is blocked from sending messages to him.`);
      return; // This error requires to do nothing.
    } else if (e.code === 902) { // Can't send messages to this user due to their privacy settings
      const peerId = context?.request?.peerId;
      console.log(`${peerId} peer does not allow to send messages to him.`);
      return; // This error requires to do nothing.
      // TODO: unfriend or block user
      // TODO: or make a script that check all such users, and unfriends them or blocks them
    } else if (e.code === 7) { // Permission to perform this action is denied
      const peerId = context?.request?.peerId;
      console.log(`${peerId} peer is deactivated (blocked or deleted).`);
      return; // This error requires to do nothing.
      // TODO: unfriend
    } else {
      throw e;
    }
  }
};

module.exports = {
  queue,
  tickSize,
  typingSpeedInCharactersPerMinute,
  typingSpeedInCharactersPerSecond,
  calculateMinimumSecondsToType,
  randomInRange,
  handleOutgoingMessage,
  enqueueMessage
};