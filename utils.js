const { DateTime } = require('luxon');
const fs = require('fs');

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const hasSticker = (context, stickersIds) => {
  for (const attachment of context?.attachments || []) {
    if (attachment?.id) {
      const stickerId = attachment?.id;
      // console.log('stickerId', stickerId);
      return stickersIds.includes(stickerId);
    } else {
      const stickerId = attachment?.sticker?.sticker_id;
      // console.log('stickerId', stickerId);
      return stickersIds.includes(stickerId);
    }
  }
  return false;
}

const sleep = ms => new Promise(resolve => {
  console.log(`Sleeping for ${ms} ms...`);
  setTimeout(() => {
    console.log(`Wake up after ${ms} ms.`)
    resolve();
  }, ms);
});

function eraseMetadata(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clean(obj) {
  for (var propName in obj) { 
    if (obj[propName] === null || obj[propName] === undefined || obj[propName]?.length === 0) {
      delete obj[propName];
    }
    // if(typeof obj[propName] === 'object'){
    //   clean(obj[propName]); //recursive for nested objects
    // }
  }
  return obj;
}

function readJsonSync(path) {
  return JSON.parse(fs.readFileSync(path));
}

function saveJsonSync(path, obj) {
  return fs.writeFileSync(path, JSON.stringify(obj, null, 2));
}

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
  eraseMetadata,
  clean,
  readJsonSync,
  saveJsonSync,
};