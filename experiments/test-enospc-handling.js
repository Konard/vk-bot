const jsonStore = require('../json-store');
const fs = require('fs').promises;

async function testENOSPCHandling() {
  console.log('Testing ENOSPC error handling...\n');

  const testFile = './test-enospc/cache.json';

  try {
    const store = await jsonStore({ filePath: testFile });

    // Store some initial data
    console.log('Adding initial cache entries...');
    await store.set('entry1', 'Initial data 1');
    await store.set('entry2', 'Initial data 2');

    // Mock fs.writeFile to simulate ENOSPC error
    const originalWriteFile = fs.writeFile;
    let attemptCount = 0;

    fs.writeFile = async function mockWriteFile(filePath, data) {
      attemptCount++;
      console.log(`Write attempt ${attemptCount} for file: ${filePath}`);

      if (attemptCount <= 2) { // First 2 attempts fail
        const error = new Error('ENOSPC: no space left on device, write');
        error.code = 'ENOSPC';
        error.errno = -28;
        error.syscall = 'write';
        throw error;
      }

      // Third attempt succeeds
      console.log('Write attempt succeeded!');
      return originalWriteFile.call(this, filePath, data);
    };

    // This should trigger the ENOSPC handling and retry logic
    console.log('Adding entry that will trigger ENOSPC handling...');
    await store.set('entry3', 'This should trigger retry logic');

    // Wait for delayed save to complete
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Restore original function
    fs.writeFile = originalWriteFile;

    // Verify data was saved correctly
    console.log('Verifying data integrity...');
    const data1 = await store.get('entry1');
    const data2 = await store.get('entry2');
    const data3 = await store.get('entry3');

    console.log('Retrieved data:');
    console.log('entry1:', data1);
    console.log('entry2:', data2);
    console.log('entry3:', data3);

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    try {
      await fs.rm('./test-enospc', { recursive: true, force: true });
      console.log('Cleanup completed');
    } catch (cleanupError) {
      console.log('Cleanup failed (this is OK):', cleanupError.message);
    }
  }
}

if (require.main === module) {
  testENOSPCHandling().catch(console.error);
}

module.exports = { testENOSPCHandling };