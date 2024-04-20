const { VK } = require('vk-io');
const { sleep } = require('./utils');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const getAllStickerKeywords = async () => {
  let allKeywords = [];
  let offset = 0;
  const count = 1000; // Set maximum items per request if applicable

  try {
    while (true) {
      const response = await vk.api.store.getStickersKeywords({
        count,
        offset,
      });

      console.log(response);

      const { count: total, items } = response;

      // Add the loaded keywords to the allKeywords array
      allKeywords = allKeywords.concat(items);

      if (allKeywords.length >= total) {
        break; // Break the loop if all keywords have been fetched
      }

      // Prepare the offset for the next request
      offset += items.length;
      console.log(`Loaded ${offset} of ${total} sticker keywords.`);

      // Implement delay if required by rate limits
      await new Promise(r => setTimeout(r, 200)); // 200ms delay
    }
  } catch (error) {
    console.error('An error occurred while fetching sticker keywords:', error);
  }

  return allKeywords;
};

getAllStickerKeywords().then(keywords => {
  console.log('loaded keywords:', JSON.stringify(keywords, null, 2));
}).catch(console.error);