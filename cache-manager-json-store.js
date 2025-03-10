const fs = require('fs').promises;
const path = require('path');

async function jsonStore({ filePath }) {
  let cache = {};

  const dir = path.dirname(filePath);
  console.log(`Creating directory: ${dir}`);
  await fs.mkdir(dir, { recursive: true });

  if (await fileExists(filePath)) {
    console.log(`File exists: ${filePath}`);
    const data = await fs.readFile(filePath, 'utf8');
    cache = JSON.parse(data);
    console.log(`Loaded cache from file: ${filePath}`);
  } else {
    console.log(`File does not exist: ${filePath}`);
  }

  async function saveCache() {
    console.log(`Saving cache to file: ${filePath}`);
    await fs.writeFile(filePath, JSON.stringify(cache, null, 2));
  }

  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  return {
    get: async (key, callback) => {
      console.log(`Getting value for key: ${key}`);
      callback(null, cache[key]);
    },
    set: async (key, value, options, callback) => {
      console.log(`Setting value for key: ${key}`);
      cache[key] = value;
      await saveCache();
      callback(null, true);
    },
    del: async (key, callback) => {
      console.log(`Deleting value for key: ${key}`);
      delete cache[key];
      await saveCache();
      callback(null, true);
    },
    reset: async (callback) => {
      console.log(`Resetting cache`);
      cache = {};
      await saveCache();
      callback(null, true);
    },
    keys: async (callback) => {
      console.log(`Getting all keys`);
      callback(null, Object.keys(cache));
    }
  };
}

module.exports = jsonStore;
