const { trigger } = require('./triggers/delete-outgoing-requests');
const { executeTrigger, getToken } = require('./utils');
const { VK } = require('vk-io');
const token = getToken();
const vk = new VK({ token, apiTimeout: 60000 }); // Increase timeout to 60 seconds

const maxDeletedFriendsOutgoingRequestsCount = Number(process.argv[2]) || 0;

executeTrigger(trigger, { vk, options: { maxRequests: maxDeletedFriendsOutgoingRequestsCount } });