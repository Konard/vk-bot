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

async function executeTrigger(trigger, context) {
  if (!trigger) {
    return;
  }
  let peerState;
  const peerId = context?.request?.peerId;
  if (context?.states && peerId) {
    peerState = context?.states[peerId];
  }
  const currentContext = { ...context, state: peerState };
  console.log(`Checking for '${trigger.name}' trigger...`);
  if (!trigger.condition || (await trigger.condition(currentContext))) {
    try {
      console.log(`'${trigger.name}' trigger selected to be executed.`);
      await trigger.action(currentContext);
      console.log(`'${trigger.name}' trigger is executed.`);
      if (peerState && trigger.name) {
        const triggers = peerState.triggers ??= {};
        const triggerState = triggers[trigger.name] ??= {};
        triggerState.lastTriggered = DateTime.now();
        console.log(`'${trigger.name}' trigger has updated the state for user ${peerId}:`, JSON.stringify(peerState, null, 2));
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