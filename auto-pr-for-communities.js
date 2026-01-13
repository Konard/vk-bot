const { trigger } = require('./triggers/auto-pr-for-communities');
const { executeTrigger, getToken } = require('./utils');
const { VK } = require('vk-io');
const token = getToken();
const vk = new VK({ token });

executeTrigger(trigger, { vk });