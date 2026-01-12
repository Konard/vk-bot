const { VK } = require('vk-io');
const { getToken } = require('../utils');

async function testAbortError() {
  const token = getToken();
  const vk = new VK({ token });

  console.log('Testing VK API with current configuration...');

  try {
    console.log('1. Testing simple API call...');
    const profile = await vk.api.users.get();
    console.log('Profile API call successful:', profile[0].id);

    console.log('2. Testing friends.getRequests...');
    const requests = await vk.api.friends.getRequests({ count: 5 });
    console.log('Friend requests API call successful, count:', requests.items.length);

    console.log('3. Testing with custom timeout...');
    // Try with a custom timeout to see if this causes the abort error
    const requestsWithTimeout = await vk.api.friends.getRequests({
      count: 5
    });
    console.log('Friend requests with timeout successful, count:', requestsWithTimeout.items.length);

  } catch (error) {
    console.error('Error occurred:', error);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
  }
}

testAbortError();