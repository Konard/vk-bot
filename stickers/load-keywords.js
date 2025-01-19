const { VK } = require('vk-io');
const { saveJsonSync, readTextSync, getToken } = require('../utils');
const token = getToken();
const vk = new VK({ token });

const getAllStickerKeywords = async () => {
  let result = [];
  // let offset = 0;
  // const count = 1; // Set maximum items per request if applicable

  try {
    // while (true) {
    const response = await vk.api.store.getStickersKeywords({
      all_products: 1,
      need_stickers: 0,
      // aliases: 0,
    });

    // console.log(response);

    const { count: total, dictionary: items } = response;

    result = items;

    for (const item of result) {
      const stickers = item.user_stickers || item.stickers;

      if (stickers) {
        for (const sticker of stickers) {
          delete sticker.images;
          delete sticker.images_with_background;
          // console.log(Object.keys(sticker));
        }
  
        if (item.words.includes('привет')) {
          const greetingStickerIds = stickers.map(sticker => sticker.sticker_id);
          console.log({ greetingStickerIds });
        }
      }
    }

    // Add the loaded keywords to the result array
    // result = result.concat(items);

    // if (result.length >= total) {
      // break; // Break the loop if all keywords have been fetched
    // }

    // Prepare the offset for the next request
    // offset += items.length;
    console.log(`Loaded ${total} sticker keywords.`);

    // Implement delay if required by rate limits
    // await new Promise(r => setTimeout(r, 200)); // 200ms delay
    // }
  } catch (error) {
    console.error('An error occurred while fetching sticker keywords:', error);
  }

  return result;
};

getAllStickerKeywords().then(keywords => {
  // console.log('loaded keywords:', JSON.stringify(keywords, null, 2));
  saveJsonSync('keywords.json', keywords);
}).catch(console.error);