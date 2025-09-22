const fs = require('fs').promises;
const path = require('path');
const { base32hex } = require('rfc4648');

const encoder = new TextEncoder(); 
const decoder = new TextDecoder('utf-8');

const { second, ms } = require('./time-units');

const saveDelay = (5 * second) / ms; // Delay before saving individual files
const MAX_CACHE_ENTRIES = 10000; // Maximum number of cache entries
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function multiJsonStore({ folderPath }) {
  let persistentCache = {};                  // In-memory cache of all entries
  const pendingSaveTimeouts = {};            // Track pending save timeouts per key

  console.log(`Ensuring cache directory exists: ${folderPath}`);
  await fs.mkdir(folderPath, { recursive: true });

  // ────────────────────────────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────────────────────────────
  function encodeKey(key) {
    // Always encode using Base-32 (RFC 4648 §6)
    return base32hex.stringify(encoder.encode(String(key)))
      .replace(/=+$/, '')
      .toLowerCase();
  }

  function decodeFilename(name) {
    try {
      // Restore padding for Base-32 decoding
      const padding = '='.repeat((8 - (name.length % 8)) % 8);
      const decoded = decoder.decode(base32hex.parse(name.toUpperCase() + padding));
      // Verify round-trip to avoid accidental false positives
      if (encodeKey(decoded) !== name) throw new Error('round-trip mismatch');
      return decoded;
    } catch (err) {
      // Do not ignore decoding errors – throw to notify caller
      throw new Error(`Invalid Base-32 name "${name}": ${err.message}`);
    }
  }

  async function checkDiskSpace() {
    try {
      // Check if directory exists first
      await fs.access(folderPath);
      const stats = await fs.statfs(folderPath);
      const freeSpace = stats.bavail * stats.blksize;
      return freeSpace > 50 * 1024 * 1024; // Require at least 50MB free space
    } catch (error) {
      // If we can't check or directory doesn't exist, assume we have space
      return true;
    }
  }

  function cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const key of Object.keys(persistentCache)) {
      const entry = persistentCache[key];
      if (entry && entry.expiresAt && now > entry.expiresAt) {
        delete persistentCache[key];
        // Also try to delete the file
        const filename = `${encodeKey(key)}.json`;
        fs.unlink(path.join(folderPath, filename)).catch(() => {});
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
    return cleanedCount;
  }

  function enforceCacheEntryLimit() {
    const entryCount = Object.keys(persistentCache).length;
    if (entryCount <= MAX_CACHE_ENTRIES) {
      return false;
    }

    console.log(`Cache entries (${entryCount}) exceed limit. Cleaning up...`);

    // First try cleaning expired entries
    cleanupExpiredEntries();
    if (Object.keys(persistentCache).length <= MAX_CACHE_ENTRIES) {
      return true;
    }

    // If still too many, remove oldest entries
    const entries = Object.entries(persistentCache);
    entries.sort((a, b) => {
      const aTime = a[1].lastAccessed || 0;
      const bTime = b[1].lastAccessed || 0;
      return aTime - bTime;
    });

    const targetCount = Math.floor(MAX_CACHE_ENTRIES * 0.8); // Reduce to 80% of limit
    let removedCount = 0;
    while (Object.keys(persistentCache).length > targetCount && entries.length > 0) {
      const [key] = entries.shift();
      delete persistentCache[key];
      // Also try to delete the file
      const filename = `${encodeKey(key)}.json`;
      fs.unlink(path.join(folderPath, filename)).catch(() => {});
      removedCount++;
    }

    console.log(`Removed ${removedCount} cache entries to enforce limit`);
    return true;
  }

  async function scheduleSave(key) {
    if (pendingSaveTimeouts[key]) {
      clearTimeout(pendingSaveTimeouts[key]); // Restart the pending save
      console.log(`Pending save for key ${key} restarted`);
    }

    pendingSaveTimeouts[key] = setTimeout(async () => {
      console.log(`Saving key ${key} after delay`);

      // Check cache limits before saving
      enforceCacheEntryLimit();

      // Check disk space before attempting to write
      if (!(await checkDiskSpace())) {
        console.error('Insufficient disk space, skipping save for key:', key);
        delete pendingSaveTimeouts[key];
        return;
      }

      const filename = `${encodeKey(key)}.json`;
      const filePath = path.join(folderPath, filename);

      // Retry logic for writing to disk
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          const data = JSON.stringify(persistentCache[key], null, 2);
          await fs.writeFile(filePath, data);
          console.log(`Key ${key} saved successfully (${(Buffer.byteLength(data, 'utf8') / 1024).toFixed(2)}KB)`);
          break;
        } catch (error) {
          attempt++;
          console.error(`Save attempt ${attempt} for key ${key} failed:`, error.message);

          if (error.code === 'ENOSPC') {
            console.error('No space left on device. Cleaning up cache and retrying...');
            // Force cleanup
            cleanupExpiredEntries();
            const keys = Object.keys(persistentCache);
            const toRemove = Math.ceil(keys.length * 0.3); // Remove 30% of entries
            for (let i = 0; i < toRemove && i < keys.length; i++) {
              if (keys[i] !== key) { // Don't remove the key we're trying to save
                delete persistentCache[keys[i]];
              }
            }
            console.log(`Emergency cleanup: removed ${toRemove} cache entries`);
          }

          if (attempt >= MAX_RETRIES) {
            console.error(`Failed to save key ${key} after ${MAX_RETRIES} attempts.`);
            break;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }

      delete pendingSaveTimeouts[key];
    }, saveDelay);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  //  Load existing cache files on start-up
  // ────────────────────────────────────────────────────────────────────────────────
  const files = await fs.readdir(folderPath);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const base = path.basename(file, '.json');
    const key = decodeFilename(base);
    const data = await fs.readFile(path.join(folderPath, file), 'utf8');
    try {
      persistentCache[key] = JSON.parse(data);
      console.log(`Loaded cache entry from ${file}`);
    } catch (err) {
      console.warn(`Failed to parse ${file}:`, err.message);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  //  Public API – identical shape to the original jsonStore
  // ────────────────────────────────────────────────────────────────────────────────
  return {
    get: async (key) => {
      const entry = persistentCache[key];
      if (entry && entry.expiresAt && Date.now() > entry.expiresAt) {
        console.log(`Key ${key} has expired`);
        await fs.unlink(path.join(folderPath, `${encodeKey(key)}.json`)).catch(() => {});
        delete persistentCache[key];
        return null;
      }

      // Update last accessed time for LRU eviction
      if (entry) {
        entry.lastAccessed = Date.now();
      }

      return entry ? entry.value : null;
    },

    set: async (key, value, options) => {
      persistentCache[key] = {
        value,
        expiresAt: options && options.ttl ? Date.now() + options.ttl * 1000 : null,
        lastAccessed: Date.now()
      };
      await scheduleSave(key);
    },

    del: async (key) => {
      console.log(`Deleting value for key: ${key}`);
      delete persistentCache[key];
      await fs.unlink(path.join(folderPath, `${encodeKey(key)}.json`)).catch(() => {});
    },

    reset: async () => {
      console.log('Resetting persistent cache');
      persistentCache = {};
      const files = await fs.readdir(folderPath);
      await Promise.all(
        files.map(
          file => file.endsWith('.json') && fs.unlink(path.join(folderPath, file)).catch(() => {})
        )
      );
    },

    keys: async () => {
      console.log('Getting all keys');
      const now = Date.now();
      return Object.keys(persistentCache).filter(k => {
        const e = persistentCache[k];
        return !(e.expiresAt && now > e.expiresAt);
      });
    }
  };
}

module.exports = multiJsonStore;