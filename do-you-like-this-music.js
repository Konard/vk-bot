const { VK } = require('vk-io');
const { executeTrigger, getToken } = require('./utils');
const { trigger } = require('./triggers/do-you-like-this-music');
const { randomInRange, handleOutgoingMessage, enqueueMessage, queue } = require('./outgoing-messages');
const fs = require('fs');
const token = getToken();
const vk = new VK({ token });

const maxGreetings = Number(process.argv[2]) || 0;

if (maxGreetings > 0) {
  let finished = false;
  executeTrigger(trigger, { vk, options: { maxGreetings } }).then(() => { 
    finished = true
  }).catch((e) => {
    finished = true;
    console.error(e);
  });
  const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);
  const finalizerInterval = setInterval(() => {
    if (finished && queue.length == 0) {
      setTimeout(() => {
        clearInterval(messagesHandlerInterval);
      }, 10000);
      clearInterval(finalizerInterval);
    }
  }, 1000);
}
