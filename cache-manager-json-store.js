const fs = require('fs').promises;
const path = require('path');

const { second } = require('./utils');

const saveDelay = 5 * second; // Delay before saving to file

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

  async function savePersistentCache() {
    if (pendingSaveTimeout) {
      clearTimeout(pendingSaveTimeout); // Restart the pending save
      console.log('Pending save restarted');
    }

    pendingSaveTimeout = setTimeout(async () => {
      console.log('Executing pending save after delay');
      await fs.writeFile(filePath, JSON.stringify(persistentCache, null, 2));
      pendingSaveTimeout = null; // Clear the timeout
    }, saveDelay);
  }

  return {
    get: async (key, callback) => {
      console.log(`Getting value for key: ${key}`);
      const entry = persistentCache[key];
      if (entry && entry.expiresAt && Date.now() > entry.expiresAt) {
        console.log(`Key ${key} has expired`);
        delete persistentCache[key];
        await savePersistentCache();
        if (callback) callback(null, undefined);
        return;
      }
      if (callback) callback(null, entry ? entry.value : undefined);
    },
    set: async (key, value, options, callback) => {
      console.log(`Setting value for key: ${key}, value:`, value);
      persistentCache[key] = {
        value,
        expiresAt: options && options.ttl ? Date.now() + options.ttl * 1000 : null, // Store expiration timestamp
      };
      await savePersistentCache();
      console.log(`Persistent cache updated for key: ${key}`);
      if (callback) callback(null, true);
    },
    del: async (key, callback) => {
      console.log(`Deleting value for key: ${key}`);
      delete persistentCache[key];
      await savePersistentCache();
      if (callback) callback(null, true);
    },
    reset: async (callback) => {
      console.log(`Resetting persistent cache`);
      persistentCache = {};
      await savePersistentCache();
      if (callback) callback(null, true);
    },
    keys: async (callback) => {
      console.log(`Getting all keys`);
      const validKeys = Object.keys(persistentCache).filter(key => {
        const entry = persistentCache[key];
        return !(entry.expiresAt && Date.now() > entry.expiresAt);
      });
      if (callback) callback(null, validKeys);
    }
  };
}

module.exports = jsonStore;
