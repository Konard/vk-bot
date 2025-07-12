const fs = require('fs').promises;
const path = require('path');
const { base32hex } = require('rfc4648');

const encoder = new TextEncoder(); 
const decoder = new TextDecoder('utf-8');

const { second, ms } = require('./time-units');

const saveDelay = (5 * second) / ms; // Delay before saving individual files

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

  async function scheduleSave(key) {
    if (pendingSaveTimeouts[key]) {
      clearTimeout(pendingSaveTimeouts[key]); // Restart the pending save
      console.log(`Pending save for key ${key} restarted`);
    }

    pendingSaveTimeouts[key] = setTimeout(async () => {
      console.log(`Saving key ${key} after delay`);
      const filename = `${encodeKey(key)}.json`;
      await fs.writeFile(
        path.join(folderPath, filename),
        JSON.stringify(persistentCache[key], null, 2)
      );
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
      return entry ? entry.value : null;
    },

    set: async (key, value, options) => {
      persistentCache[key] = {
        value,
        expiresAt: options && options.ttl ? Date.now() + options.ttl * 1000 : null,
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