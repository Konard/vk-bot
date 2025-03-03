const { VK } = require('vk-io');
const { getToken, executeTrigger, sleep } = require('./utils');
const { handleOutgoingMessage, queue } = require('./outgoing-messages');
const token = getToken();
const vk = new VK({ token });
const { trigger: sendBirthDayCongratulationsTrigger } = require('./triggers/send-birthday-congratulations');

let finished = false;
executeTrigger(sendBirthDayCongratulationsTrigger, { vk }).then(() => { 
  finished = true
}).catch((e) => {
  finished = true;
  console.error(e);
});

const messagesHandlerInterval = setInterval(handleOutgoingMessage, 1000);
const finalizerInterval = setInterval(async () => {
  if (finished) {
    while (queue.length > 0) {
      await sleep(1000);
    }
    if (messagesHandlerInterval) {
      clearInterval(messagesHandlerInterval);
    }
    if (finalizerInterval) {
      clearInterval(finalizerInterval);
    }
  }
}, 2000);
