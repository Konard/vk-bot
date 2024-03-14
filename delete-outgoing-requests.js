const { trigger } = require('./triggers/delete-outgoing-requests');
const { executeTrigger } = require('./utils');
const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const maxDeletedFriendsOutgoingRequestsCount = Number(process.argv[2]) || 0;

executeTrigger(trigger, { vk, options: { maxRequests: maxDeletedFriendsOutgoingRequestsCount } });