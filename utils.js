const { DateTime } = require('luxon');

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const hasSticker = (context, stickersIds) => {
  for (const attachment of context?.attachments || []) {
    const stickerId = attachment?.id;
    console.log('stickerId', stickerId);
    return stickersIds.includes(stickerId);
  }
  return false;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function executeTrigger(trigger, context, state) {
  if (!trigger) {
    return;
  }
  let peerState;
  const peerId = context?.request?.peerId;
  if (state && peerId) {
    peerState = state[peerId];
  }
  console.log(`Checking for '${trigger.name}' trigger...`);
  if (!trigger.condition || (await trigger.condition({ ...context, peerState }))) {
    try {
      await trigger.action({ ...context, peerState });
      console.log(`'${trigger.name}' trigger is executed.`);

      if (state && peerId && trigger.name) {
        const peer = state[peerId] ??= {};
        const triggers = peer.triggers ??= {};
        const triggerState = triggers[trigger.name] ??= {};
        triggerState.lastTriggered = DateTime.now();
        console.log(`'${trigger.name}' trigger has updated the state:`, JSON.stringify(state, null, 2));
      }
    } catch (e) {
      console.error(`Execution of '${trigger.name}' trigger is failed:`, e);
    }
  } else {
    console.log(`No need to execute '${trigger.name}' trigger.`);
  }
}

module.exports = {
  getRandomElement,
  hasSticker,
  sleep,
  executeTrigger,
};