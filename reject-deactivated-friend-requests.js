const { VK } = require('vk-io');
const { sleep, getToken, second, ms } = require('./utils');
const token = getToken();
const vk = new VK({ token });

const rejectDeactivatedFriendRequests = async () => {
  try {
    const maxFriendRequestsCount = 1000;
    const requests = await vk.api.friends.getRequests({ count: maxFriendRequestsCount, sort: 1 });

    for (let userId of requests.items) {
      try {
        const response = await vk.api.users.get({
          user_ids: [userId],
          fields: ['deactivated']
        });
        await sleep((5 * second) / ms);

        const deactivationStatus = response?.[0]?.deactivated;

        if (deactivationStatus === 'banned' || deactivationStatus === 'deleted') {
          await vk.api.friends.delete({ user_id: userId });
          console.log(`Rejected friend request from banned user: ${userId}`);
          await sleep((10 * second) / ms);
        } else if(deactivationStatus) {
          console.log(`User ${userId} deactivation status: ${deactivationStatus}`);
        }
      } catch (error) {
        console.error(`Error processing user ${userId}: ${error.message}`);
      }
    }
    console.log('All banned friend requests have been rejected.');
  } catch (error) {
    console.error(`Error rejecting banned friend requests: ${error.message}`);
  }
};

rejectDeactivatedFriendRequests();