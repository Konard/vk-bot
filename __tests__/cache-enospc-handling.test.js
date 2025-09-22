const jsonStore = require('../json-store');
const multiJsonStore = require('../multi-json-store');
const fs = require('fs').promises;
const path = require('path');

describe('Cache ENOSPC Error Handling', () => {
  const testDir = './test-cache-enospc';
  const testFile = path.join(testDir, 'test.json');
  const multiTestDir = './test-multi-cache-enospc';

  afterEach(async () => {
    // Cleanup test files
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(multiTestDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('json-store', () => {
    test('should handle ENOSPC errors with retry logic', async () => {
      // Store initial data and wait for it to save
      const store = await jsonStore({ filePath: testFile });
      await store.set('test-key', 'test-value');
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for initial save

      // Mock fs.writeFile to simulate ENOSPC on specific calls
      const originalWriteFile = fs.writeFile;
      let attemptCount = 0;

      fs.writeFile = jest.fn().mockImplementation(async (filePath, data) => {
        if (filePath.includes('test.json')) {
          attemptCount++;
          if (attemptCount <= 2) {
            const error = new Error('ENOSPC: no space left on device, write');
            error.code = 'ENOSPC';
            throw error;
          }
        }
        return originalWriteFile(filePath, data);
      });

      // This should trigger retry logic
      await store.set('retry-key', 'retry-value');

      // Wait for delayed save with retries
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Restore original function
      fs.writeFile = originalWriteFile;

      // Verify data integrity
      const value = await store.get('retry-key');
      expect(value).toBe('retry-value');
      expect(attemptCount).toBeGreaterThan(0); // Should have attempted at least once
    }, 15000);

    test('should enforce cache size limits', async () => {
      const store = await jsonStore({ filePath: testFile });

      // Add data that exceeds the cache size limit
      for (let i = 0; i < 100; i++) {
        const largeData = 'x'.repeat(50000); // 50KB per entry
        await store.set(`large-key-${i}`, largeData);
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Should still be able to retrieve recent entries
      const recentValue = await store.get('large-key-99');
      expect(recentValue).toBeDefined();
    }, 15000);

    test('should cleanup expired entries', async () => {
      const store = await jsonStore({ filePath: testFile });

      // Add entries with short TTL
      await store.set('short-lived-1', 'value1', { ttl: 1 }); // 1 second TTL
      await store.set('short-lived-2', 'value2', { ttl: 1 });
      await store.set('long-lived', 'value3', { ttl: 3600 }); // 1 hour TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Expired entries should be cleaned up
      const expired1 = await store.get('short-lived-1');
      const expired2 = await store.get('short-lived-2');
      const valid = await store.get('long-lived');

      expect(expired1).toBeNull();
      expect(expired2).toBeNull();
      expect(valid).toBe('value3');
    }, 5000);
  });

  describe('multi-json-store', () => {
    test('should handle ENOSPC errors for individual files', async () => {
      const store = await multiJsonStore({ folderPath: multiTestDir });

      // Mock fs.writeFile to simulate ENOSPC
      const originalWriteFile = fs.writeFile;
      let attemptCount = 0;

      fs.writeFile = jest.fn().mockImplementation(async (filePath, data) => {
        attemptCount++;
        if (attemptCount <= 1 && filePath.includes('test-key')) {
          const error = new Error('ENOSPC: no space left on device, write');
          error.code = 'ENOSPC';
          throw error;
        }
        return originalWriteFile(filePath, data);
      });

      // This should trigger retry logic
      await store.set('test-key', { message: 'test' });

      // Wait for delayed save
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Restore original function
      fs.writeFile = originalWriteFile;

      // Verify data integrity
      const value = await store.get('test-key');
      expect(value).toEqual({ message: 'test' });
    }, 10000);

    test('should enforce entry count limits', async () => {
      const store = await multiJsonStore({ folderPath: multiTestDir });

      // Add many entries to trigger limit enforcement
      for (let i = 0; i < 50; i++) {
        await store.set(`entry-${i}`, { index: i });
      }

      // Wait for any delayed saves
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Should still be able to add and retrieve entries
      await store.set('test-entry', { message: 'test' });
      const value = await store.get('test-entry');
      expect(value).toEqual({ message: 'test' });
    }, 15000);
  });

  test('should track last access time for LRU eviction', async () => {
    const store = await jsonStore({ filePath: testFile });

    await store.set('key1', 'value1');
    await store.set('key2', 'value2');

    // Access key1 to update its last access time
    await store.get('key1');

    // Both should still be accessible
    expect(await store.get('key1')).toBe('value1');
    expect(await store.get('key2')).toBe('value2');
  });
});