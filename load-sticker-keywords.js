const { VK } = require('vk-io');
const { sleep, saveJsonSync } = require('./utils');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const getAllStickerKeywords = async () => {
  let result = [];
  // let offset = 0;
  // const count = 1; // Set maximum items per request if applicable

  try {
    // while (true) {
    const response = await vk.api.store.getStickersKeywords({
      // all_products: true,
    });

    console.log(response);

    const { count: total, dictionary: items } = response;

    result = items;

    // Add the loaded keywords to the result array
    // result = result.concat(items);

    // if (result.length >= total) {
      // break; // Break the loop if all keywords have been fetched
    // }

    // Prepare the offset for the next request
    // offset += items.length;
    console.log(`Loaded ${offset} of ${total} sticker keywords.`);

    // Implement delay if required by rate limits
    // await new Promise(r => setTimeout(r, 200)); // 200ms delay
    // }
  } catch (error) {
    console.error('An error occurred while fetching sticker keywords:', error);
  }

  return result;
};

getAllStickerKeywords().then(keywords => {
  console.log('loaded keywords:', JSON.stringify(keywords, null, 2));
  saveJsonSync('sticker-keywords.json', keywords);
}).catch(console.error);