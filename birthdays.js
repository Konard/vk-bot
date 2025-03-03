const { VK } = require('vk-io');
const { getToken, executeTrigger, sleep } = require('./utils');
const { handleOutgoingMessage, queue } = require('./outgoing-messages');
const { trigger: sendBirthDayCongratulationsTrigger } = require('./triggers/send-birthday-congratulations');
const token = getToken();
const vk = new VK({ token });

let finished = false;
executeTrigger(sendBirthDayCongratulationsTrigger, { vk }).then(() => { 
  finished = true
}).catch((e) => {
  finished = true;
  console.error(e);
});

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);
const finalizerInterval = setInterval(async () => {
  if (finished && queue.length === 0) {
    if (finalizerInterval) {
      clearInterval(finalizerInterval);
    }
    setTimeout(() => {
      if (messagesHandlerInterval) {
        clearInterval(messagesHandlerInterval);
      }
    }, 5000);
  }
}, 2000);
