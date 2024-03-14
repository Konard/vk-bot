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
  if (!trigger.condition || (await trigger.condition({ ...context, peerState }))) {
    try {
      await trigger.action({ ...context, peerState });

      if (state && peerId && trigger.name) {
        const peer = state[peerId] ??= {};
        const triggers = peer.triggers ??= {};
        const triggerState = triggers[trigger.name] ??= {};
        triggerState.lastTriggered = DateTime.now();
        console.log('state', JSON.stringify(state, null, 2));
      }
    } catch (e) {
      console.error(`Execution of '${trigger.name}' trigger is failed:`, e);
    }
  }
}

module.exports = {
  getRandomElement,
  hasSticker,
  sleep,
  executeTrigger,
};