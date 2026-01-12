const { VK } = require('vk-io');
const { getToken } = require('../utils');
const { trigger: removeInactiveFriendsTrigger } = require('../triggers/remove-inactive-friends');

const token = getToken();
const vk = new VK({ token });

(async () => {
  console.log('Testing remove-inactive-friends trigger...');

  try {
    // Check current friends count
    const allFriendsResponse = await vk.api.friends.get({ count: 1 });
    console.log(`Current friends count: ${allFriendsResponse.count}`);

    // Check incoming friend requests
    const requestsResponse = await vk.api.friends.getRequests({ count: 1, out: 0 });
    console.log(`Incoming friend requests count: ${requestsResponse.count}`);

    // Run the trigger
    await removeInactiveFriendsTrigger.action({ vk });

    console.log('Trigger execution completed successfully.');
  } catch (error) {
    console.error('Error during trigger execution:', error);
  }
})();
