const { VK } = require('vk-io');
const { executeTrigger, getToken, app } = require('./utils');
const { handleOutgoingMessage, queue } = require('./outgoing-messages');
const token = getToken();
const vk = new VK({ token });
const { trigger } = require('./triggers/greet-friends');

const maxGreetings = Number(process.argv[2]) || 0;

if (maxGreetings > 0) {
  executeTrigger(trigger, { vk, options: { maxGreetings } }).then(() => { 
    app.gracefullyFinished = true;
  }).catch((e) => {
    app.gracefullyFinished = true;
    console.error(e);
  });
  const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);
  const finalizerInterval = setInterval(() => {
    if (app.gracefullyFinished && queue.length == 0) {
      setTimeout(() => {
        clearInterval(messagesHandlerInterval);
      }, 10000);
      clearInterval(finalizerInterval);
    }
  }, 1000);
}
