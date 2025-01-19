const { trigger } = require('./triggers/delete-outgoing-requests');
const { executeTrigger, getToken } = require('./utils');
const { VK } = require('vk-io');
const token = getToken();
const vk = new VK({ token });

const maxDeletedFriendsOutgoingRequestsCount = Number(process.argv[2]) || 0;

executeTrigger(trigger, { vk, options: { maxRequests: maxDeletedFriendsOutgoingRequestsCount } });