const { trigger } = require('./triggers/send-invitation-posts-for-friends');
const { executeTrigger, getToken } = require('./utils');
const { VK } = require('vk-io');
const token = getToken();
const vk = new VK({ token });

executeTrigger(trigger, { vk });