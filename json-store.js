const fs = require('fs').promises;
const path = require('path');

const { second, ms } = require('./utils');

const saveDelay = (5 * second) / ms; // Delay before saving to file
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max cache size
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function jsonStore({ filePath }) {
  let persistentCache = {}; // Use only persistentCache for all operations
  let pendingSaveTimeout = null; // Track pending save timeout

  const dir = path.dirname(filePath);
  console.log(`Creating directory: ${dir}`);
  await fs.mkdir(dir, { recursive: true });

  if (await fileExists(filePath)) {
    console.log(`File exists: ${filePath}`);
    const data = await fs.readFile(filePath, 'utf8');
    persistentCache = JSON.parse(data);
    console.log(`Loaded cache from file: ${filePath}`);
  } else {
    console.log(`File does not exist: ${filePath}`);
  }

  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async function checkDiskSpace() {
    try {
      // Check if directory exists first
      await fs.access(dir);
      const stats = await fs.statfs(dir);
      const freeSpace = stats.bavail * stats.blksize;
      return freeSpace > 50 * 1024 * 1024; // Require at least 50MB free space
    } catch (error) {
      // If we can't check or directory doesn't exist, assume we have space
      return true;
    }
  }

  function getCacheSize() {
    const cacheString = JSON.stringify(persistentCache);
    return Buffer.byteLength(cacheString, 'utf8');
  }

  function cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const key of Object.keys(persistentCache)) {
      const entry = persistentCache[key];
      if (entry && entry.expiresAt && now > entry.expiresAt) {
        delete persistentCache[key];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
    return cleanedCount;
  }

  function enforceCacheSizeLimit() {
    const currentSize = getCacheSize();
    if (currentSize <= MAX_CACHE_SIZE) {
      return false;
    }

    console.log(`Cache size (${(currentSize / 1024 / 1024).toFixed(2)}MB) exceeds limit. Cleaning up...`);

    // First try cleaning expired entries
    const expiredCleaned = cleanupExpiredEntries();
    if (getCacheSize() <= MAX_CACHE_SIZE) {
      return true;
    }

    // If still too large, remove oldest entries (based on last access time)
    const entries = Object.entries(persistentCache);
    entries.sort((a, b) => {
      const aTime = a[1].lastAccessed || 0;
      const bTime = b[1].lastAccessed || 0;
      return aTime - bTime;
    });

    let removedCount = 0;
    while (getCacheSize() > MAX_CACHE_SIZE * 0.8 && entries.length > 0) { // Reduce to 80% of limit
      const [key] = entries.shift();
      delete persistentCache[key];
      removedCount++;
    }

    console.log(`Removed ${removedCount} cache entries to enforce size limit`);
    return true;
  }

  async function savePersistentCache() {
    if (pendingSaveTimeout) {
      clearTimeout(pendingSaveTimeout); // Restart the pending save
      // console.log('Pending save restarted');
    }

    pendingSaveTimeout = setTimeout(async () => {
      console.log('Executing pending save after delay');

      // Check and enforce cache size limits before saving
      enforceCacheSizeLimit();

      // Check disk space before attempting to write
      if (!(await checkDiskSpace())) {
        console.error('Insufficient disk space, skipping cache save');
        pendingSaveTimeout = null;
        return;
      }

      // Retry logic for writing to disk
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          const cacheData = JSON.stringify(persistentCache, null, 2);
          await fs.writeFile(filePath, cacheData);
          console.log(`Cache saved successfully (${(Buffer.byteLength(cacheData, 'utf8') / 1024).toFixed(2)}KB)`);
          break;
        } catch (error) {
          attempt++;
          console.error(`Save attempt ${attempt} failed:`, error.message);

          if (error.code === 'ENOSPC') {
            console.error('No space left on device. Cleaning up cache and retrying...');
            // Force cleanup more aggressively
            const keys = Object.keys(persistentCache);
            const toRemove = Math.ceil(keys.length * 0.5); // Remove 50% of entries
            for (let i = 0; i < toRemove; i++) {
              delete persistentCache[keys[i]];
            }
            console.log(`Emergency cleanup: removed ${toRemove} cache entries`);
          }

          if (attempt >= MAX_RETRIES) {
            console.error(`Failed to save cache after ${MAX_RETRIES} attempts. Cache will remain in memory.`);
            break;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }

      pendingSaveTimeout = null; // Clear the timeout
    }, saveDelay);
  }

  return {
    get: async (key) => {
      // console.log(`Getting value for key: ${key}`);
      const entry = persistentCache[key];
      // console.log(`Cache entry found:`, entry);
      if (entry && entry.expiresAt && Date.now() > entry.expiresAt) {
        console.log(`Key ${key} has expired`);
        delete persistentCache[key];
        await savePersistentCache();
        return null;
      }

      // Update last accessed time for LRU eviction
      if (entry) {
        entry.lastAccessed = Date.now();
      }

      return entry ? entry.value : null;
    },
    set: async (key, value, options) => {
      // console.log(`Setting value for key: ${key}, value:`, value);
      persistentCache[key] = {
        value,
        expiresAt: options && options.ttl ? Date.now() + options.ttl * 1000 : null, // Store expiration timestamp
        lastAccessed: Date.now()
      };
      await savePersistentCache();
      // console.log(`Persistent cache updated for key: ${key}`);
    },
    del: async (key) => {
      console.log(`Deleting value for key: ${key}`);
      delete persistentCache[key];
      await savePersistentCache();
    },
    reset: async () => {
      console.log(`Resetting persistent cache`);
      persistentCache = {};
      await savePersistentCache();
    },
    keys: async () => {
      console.log(`Getting all keys`);
      const validKeys = Object.keys(persistentCache).filter(key => {
        const entry = persistentCache[key];
        return !(entry.expiresAt && Date.now() > entry.expiresAt);
      });
      return validKeys;
    }
  };
}

module.exports = jsonStore;
