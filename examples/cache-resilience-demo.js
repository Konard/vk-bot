/**
 * Cache Resilience Demo
 *
 * This script demonstrates the enhanced cache system that prevents ENOSPC errors
 * by implementing size limits, cleanup mechanisms, and retry logic.
 */

const jsonStore = require('../json-store');
const multiJsonStore = require('../multi-json-store');

async function demonstrateCacheResilience() {
  console.log('=== Cache Resilience Demo ===\n');

  // Demo 1: Size-limited cache with automatic cleanup
  console.log('1. Demonstrating size-limited cache with automatic cleanup');
  const cache = await jsonStore({ filePath: './demo-cache/size-limited.json' });

  // Add many large entries to demonstrate size limit enforcement
  console.log('   Adding 50 large cache entries...');
  for (let i = 0; i < 50; i++) {
    const largeData = `Large data entry ${i}: ` + 'x'.repeat(50000); // ~50KB each
    await cache.set(`large-entry-${i}`, largeData, { ttl: 3600 });
  }

  console.log('   Cache will automatically clean up when size limit is exceeded');
  console.log('   Size limit: 100MB, Cleanup threshold: 80MB\n');

  // Demo 2: Multi-file cache with entry limits
  console.log('2. Demonstrating multi-file cache with entry limits');
  const multiCache = await multiJsonStore({ folderPath: './demo-cache/multi-store' });

  console.log('   Adding many small cache entries...');
  for (let i = 0; i < 100; i++) {
    await multiCache.set(`entry-${i}`, {
      message: `Entry ${i}`,
      data: 'Some cached data',
      timestamp: Date.now()
    });
  }

  console.log('   Entry limit: 10,000 entries, with LRU eviction when exceeded\n');

  // Demo 3: TTL-based expiration
  console.log('3. Demonstrating TTL-based cache expiration');
  await cache.set('short-lived', 'This will expire soon', { ttl: 2 }); // 2 seconds
  await cache.set('long-lived', 'This will persist', { ttl: 3600 }); // 1 hour

  console.log('   Added entries with different TTL values');
  console.log('   Short-lived: 2 seconds, Long-lived: 1 hour');

  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

  const expired = await cache.get('short-lived');
  const persisted = await cache.get('long-lived');

  console.log(`   After 3 seconds:`);
  console.log(`   Short-lived entry: ${expired || 'EXPIRED'}`);
  console.log(`   Long-lived entry: ${persisted ? 'EXISTS' : 'MISSING'}\n`);

  // Demo 4: Error resilience (simulated)
  console.log('4. Error resilience features:');
  console.log('   ✓ ENOSPC error handling with retry logic (up to 3 attempts)');
  console.log('   ✓ Disk space checking before writes (requires 50MB free)');
  console.log('   ✓ Automatic cache cleanup when disk space is low');
  console.log('   ✓ Graceful fallback to in-memory operation if saves fail');
  console.log('   ✓ LRU eviction based on last access time\n');

  console.log('5. Benefits of the enhanced cache system:');
  console.log('   • Prevents "ENOSPC: no space left on device" errors');
  console.log('   • Automatic size management prevents disk exhaustion');
  console.log('   • TTL-based expiration keeps cache fresh');
  console.log('   • Retry logic handles transient disk issues');
  console.log('   • LRU eviction preserves most relevant data');
  console.log('   • Minimal performance impact with delayed writes\n');

  // Cleanup
  try {
    const fs = require('fs').promises;
    await fs.rm('./demo-cache', { recursive: true, force: true });
    console.log('Demo cleanup completed');
  } catch (error) {
    console.log('Demo cleanup skipped (this is OK)');
  }

  console.log('\n=== Demo Complete ===');
}

if (require.main === module) {
  demonstrateCacheResilience().catch(console.error);
}

module.exports = { demonstrateCacheResilience };