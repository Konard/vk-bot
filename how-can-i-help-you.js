const { VK } = require('vk-io');
const { executeTrigger, getToken, second, ms } = require('./utils');
const { trigger } = require('./triggers/how-can-i-help-you');
const { handleOutgoingMessage, queue } = require('./outgoing-messages');
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
  const messagesHandlerInterval = setInterval(handleOutgoingMessage, (1 * second) / ms);
  const finalizerInterval = setInterval(() => {
    if (finished && queue.length == 0) {
      setTimeout(() => {
        clearInterval(messagesHandlerInterval);
      }, (10 * second) / ms);
      clearInterval(finalizerInterval);
    }
  }, (1 * second) / ms);
}
