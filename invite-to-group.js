const { trigger } = require('./triggers/invite-to-group');
const { executeTrigger } = require('./utils');
const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

executeTrigger(trigger, { vk });