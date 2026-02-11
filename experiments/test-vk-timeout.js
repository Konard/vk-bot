const { VK } = require('vk-io');

// For experiment purposes - normally we would use getToken()
const token = process.env.VK_TOKEN || 'dummy_token_for_testing';

async function testVKTimeoutBehavior() {
  console.log('Testing VK API timeout behavior...');

  // Test default VK instance (10 second timeout)
  console.log('\n1. Testing default VK instance (10s timeout)...');
  const vkDefault = new VK({ token });

  try {
    const startTime = Date.now();
    const requests = await vkDefault.api.friends.getRequests({ count: 10, sort: 1 });
    const endTime = Date.now();
    console.log(`✓ Default VK instance succeeded in ${endTime - startTime}ms`);
    console.log(`Found ${requests?.items?.length || 0} friend requests`);
  } catch (error) {
    console.log(`✗ Default VK instance failed:`, error.message);
    console.log(`Error type: ${error.name}, Error code: ${error.code}`);
  }

  // Test VK with extended timeout configuration
  console.log('\n2. Testing VK with extended timeout (60s timeout)...');
  try {
    const vkExtended = new VK({
      token,
      apiTimeout: 60000, // 60 seconds timeout instead of default 10 seconds
      apiRetryLimit: 3    // Keep default retry limit
    });

    const startTime = Date.now();
    const requests = await vkExtended.api.friends.getRequests({ count: 10, sort: 1 });
    const endTime = Date.now();
    console.log(`✓ Extended timeout VK instance succeeded in ${endTime - startTime}ms`);
    console.log(`Found ${requests?.items?.length || 0} friend requests`);
  } catch (error) {
    console.log(`✗ Extended timeout VK instance failed:`, error.message);
    console.log(`Error type: ${error.name}, Error code: ${error.code}`);
  }

  // Test VK with custom HTTPS agent
  console.log('\n3. Testing VK with custom HTTPS agent...');
  const https = require('https');
  const agent = new https.Agent({
    timeout: 60000, // 60 seconds
    keepAlive: true,
    keepAliveMsecs: 30000
  });

  try {
    const vkCustomAgent = new VK({
      token,
      agent,
      apiTimeout: 60000 // Also set API timeout
    });

    const startTime = Date.now();
    const requests = await vkCustomAgent.api.friends.getRequests({ count: 10, sort: 1 });
    const endTime = Date.now();
    console.log(`✓ Custom agent VK instance succeeded in ${endTime - startTime}ms`);
    console.log(`Found ${requests?.items?.length || 0} friend requests`);
  } catch (error) {
    console.log(`✗ Custom agent VK instance failed:`, error.message);
    console.log(`Error type: ${error.name}, Error code: ${error.code}`);
  }

  // Test multiple sequential API calls to see if timing out after multiple calls
  console.log('\n4. Testing multiple sequential API calls...');
  const vkSeq = new VK({
    token,
    apiTimeout: 60000 // Use extended timeout
  });

  for (let i = 1; i <= 5; i++) {
    try {
      const startTime = Date.now();
      await vkSeq.api.friends.getRequests({ count: 5, sort: 1 });
      const endTime = Date.now();
      console.log(`  Call ${i}: ✓ succeeded in ${endTime - startTime}ms`);

      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`  Call ${i}: ✗ failed with ${error.name}: ${error.message}`);
      break;
    }
  }

  console.log('\nTimeout behavior test completed.');
}

testVKTimeoutBehavior().catch(console.error);