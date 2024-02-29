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

async function executeTrigger(trigger, vk, request, state) {
  let peerState;
  if (request?.peerId) {
    peerState = state?.[request.peerId];
  }
  if (!trigger.condition || (await trigger.condition({ vk, request, peerState }))) {
    await trigger.action({ vk, request, peerState });
    if (state && trigger?.name) {
      const peer = state[request.peerId] ??= {};
      const triggers = peer.triggers ??= {};
      const triggerState = triggers[trigger.name] ??= {};
      triggerState.lastTriggered = DateTime.now();
      console.log('peers', JSON.stringify(peers, null, 2));
    }
  }
}

module.exports = {
  getRandomElement,
  hasSticker,
  sleep,
  executeTrigger,
};