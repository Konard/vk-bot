const jsonStore = require('../json-store');
const multiJsonStore = require('../multi-json-store');
const fs = require('fs').promises;
const path = require('path');

async function testCacheResilience() {
  console.log('Testing cache resilience against ENOSPC errors...\n');

  // Test 1: json-store with large data
  console.log('=== Testing json-store ===');
  const testDir = './test-cache';
  const testFile = path.join(testDir, 'test.json');

  try {
    await fs.mkdir(testDir, { recursive: true });

    const store = await jsonStore({ filePath: testFile });

    // Test storing large amounts of data
    console.log('Storing large cache entries...');
    for (let i = 0; i < 100; i++) {
      const largeData = 'x'.repeat(10000); // 10KB of data per entry
      await store.set(`key_${i}`, largeData, { ttl: 3600 });
    }

    console.log('Retrieving cache entries...');
    const retrieved = await store.get('key_50');
    console.log(`Retrieved entry length: ${retrieved?.length || 0}`);

    // Test cache size limits
    console.log('Testing cache size limits...');
    for (let i = 100; i < 15000; i++) { // This should trigger cache cleanup
      const largeData = 'y'.repeat(10000);
      await store.set(`large_key_${i}`, largeData, { ttl: 3600 });
      if (i % 1000 === 0) {
        console.log(`Added ${i} entries...`);
      }
    }

    console.log('json-store test completed successfully');

  } catch (error) {
    console.error('json-store test failed:', error.message);
  }

  // Test 2: multi-json-store
  console.log('\n=== Testing multi-json-store ===');
  const multiTestDir = './test-multi-cache';

  try {
    await fs.mkdir(multiTestDir, { recursive: true });

    const multiStore = await multiJsonStore({ folderPath: multiTestDir });

    // Test storing many small files
    console.log('Storing many cache entries...');
    for (let i = 0; i < 12000; i++) { // This should trigger entry limit cleanup
      const data = { message: `Test data ${i}`, timestamp: Date.now() };
      await multiStore.set(`entry_${i}`, data, { ttl: 3600 });
      if (i % 1000 === 0) {
        console.log(`Added ${i} entries...`);
      }
    }

    console.log('Retrieving cache entries...');
    const multiRetrieved = await multiStore.get('entry_5000');
    console.log(`Retrieved entry:`, multiRetrieved);

    console.log('multi-json-store test completed successfully');

  } catch (error) {
    console.error('multi-json-store test failed:', error.message);
  }

  // Test 3: Simulated ENOSPC error handling
  console.log('\n=== Testing ENOSPC simulation ===');
  try {
    // Create a mock fs.writeFile that fails with ENOSPC
    const originalWriteFile = fs.writeFile;
    let writeCount = 0;

    fs.writeFile = async (filePath, data) => {
      writeCount++;
      if (writeCount <= 2) { // Fail first 2 attempts
        const error = new Error('ENOSPC: no space left on device, write');
        error.code = 'ENOSPC';
        throw error;
      }
      return originalWriteFile(filePath, data);
    };

    const resilientStore = await jsonStore({ filePath: './test-resilient/test.json' });
    await resilientStore.set('test_key', 'test_value');

    // Restore original function
    fs.writeFile = originalWriteFile;

    console.log('ENOSPC simulation test completed successfully');

  } catch (error) {
    console.error('ENOSPC simulation test failed:', error.message);
  }

  // Cleanup
  console.log('\n=== Cleanup ===');
  try {
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(multiTestDir, { recursive: true, force: true });
    await fs.rm('./test-resilient', { recursive: true, force: true });
    console.log('Cleanup completed');
  } catch (error) {
    console.log('Cleanup failed (this is OK):', error.message);
  }

  console.log('\nAll tests completed!');
}

if (require.main === module) {
  testCacheResilience().catch(console.error);
}

module.exports = { testCacheResilience };