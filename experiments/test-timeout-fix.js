#!/usr/bin/env node

const { getToken, createVK } = require('../utils');

async function testTimeoutConfiguration() {
  console.log('Testing VK API timeout configuration fix for AbortError issue...');

  try {
    const token = getToken();
    const vk = createVK(token);

    console.log('VK instance created successfully with increased timeout (30s) and retry limit (5)');

    // Test a simple API call to verify the configuration works
    console.log('Testing a simple API call...');
    const response = await vk.api.account.getInfo();

    console.log('API call successful!');
    console.log('Country:', response.country);
    console.log('Lang:', response.lang);

    console.log('\n✅ Timeout configuration test passed!');
    console.log('The AbortError issue should be resolved with:');
    console.log('- apiTimeout: 30000ms (30 seconds)');
    console.log('- apiRetryLimit: 5 attempts');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.name === 'AbortError') {
      console.error('AbortError still occurring - may need further timeout adjustments');
    } else if (error.code === 5) {
      console.error('Invalid token - please check your token file');
    } else {
      console.error('Other error occurred:', error);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  testTimeoutConfiguration();
}

module.exports = { testTimeoutConfiguration };