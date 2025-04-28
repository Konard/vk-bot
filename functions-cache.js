const { createCache } = require('cache-manager');
const jsonStore = require('./json-store');
const { eraseMetadata, clean } = require('./utils');
const crypto = require('crypto');

const TTL_SECONDS = 3600; // Time-to-live in seconds
const targetPath = './data/functions/functions.json';
let cache = null;

async function getCache() {
  console.log('getCache called');
  if (cache) {
    console.log('Cache already initialized');
    return cache;
  }
  console.log('Initializing cache with jsonStore');
  const store = await jsonStore({ filePath: targetPath });

  cache = createCache({
    stores: [store],
  });

  console.log('Cache initialized');
  return cache;
}

function flattenValues(input, visited = new Set()) {
  console.log('flattenValues called with:', input);
  if (visited.has(input)) {
    console.log('Circular reference detected for input:', input);
    throw new Error('Circular reference detected');
  }

  if (input === null || typeof input !== 'object') {
    console.log('Returning primitive or null value:', input);
    return [input];
  }

  visited.add(input);
  console.log('Visited set updated:', visited);

  let flatArray = [];
  if (Array.isArray(input)) {
    console.log('Processing array:', input);
    input.forEach((item, index) => {
      console.log(`Processing array item at index ${index}:`, item);
      flatArray = flatArray.concat(flattenValues(item, visited));
    });
  } else {
    console.log('Processing object:', input);
    Object.keys(input).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(key => {
      console.log(`Processing object key: ${key}, value:`, input[key]);
      flatArray = flatArray.concat(flattenValues(input[key], visited));
    });
  }

  visited.delete(input);
  console.log('Visited set after deletion:', visited);
  console.log('Returning flattened array:', flatArray);
  return flatArray;
}

function generateCacheKey(funcName, args, options, ignoreFields = []) {
  // console.log('generateCacheKey called with:', { funcName, args, options, ignoreFields });

  const filteredArgs = [];

  for (const arg of args) {
    if (arg && typeof arg === 'object') {
      for (const field of ignoreFields) {
        if (arg.hasOwnProperty(field)) {
          // console.log(`Ignoring field ${field} in argument:`, arg);
          const copy = { ...arg };
          delete copy[field];
          filteredArgs.push(copy);
        }
      }
    }
  }

  // console.log('Filtered arguments:', filteredArgs);

  const flatArgs = flattenValues(filteredArgs);

  // console.log('Flattened arguments:', flatArgs);

  const keyArray = [funcName, ...flatArgs];
  const keyString = keyArray.join('-');
  // console.log('Generated key array:', keyArray);

  if (keyString.length > 4096) {
    const hashedKey = crypto.createHash('sha512').update(keyString).digest('hex');
    // console.log('Key length exceeded 4096 characters, returning hashed key:', hashedKey);
    return hashedKey;
  }

  // console.log('Returning generated key:', keyString);
  return keyString;
}

function makeCachedFunction(func, options = {}, ignoreFields = []) {
  console.log('makeCachedFunction called with:', { func, options, ignoreFields });
  return async function (...args) {
    console.log('Cached function called with args:', args);
    const cacheInstance = await getCache();
    const cacheKey = generateCacheKey(func.name, args, options, ignoreFields);
    console.log('Generated cache key:', cacheKey);

    const cachedResult = await cacheInstance.get(cacheKey);
    console.log('Cached result:', cachedResult);

    if (cachedResult) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return cachedResult;
    }

    console.log(`Cache miss for key: ${cacheKey}`);
    const result = await func(...args);
    console.log('Function result:', result);

    await cacheInstance.set(cacheKey, result, { ttl: TTL_SECONDS });
    console.log('Result cached with key:', cacheKey);

    return result;
  };
}

module.exports = {
  makeCachedFunction,
  generateCacheKey,
};