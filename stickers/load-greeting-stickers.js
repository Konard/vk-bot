const { VK } = require('vk-io');
const { sleep, readJsonSync, saveJsonSync } = require('./utils');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const stickerKeywords = readJsonSync('sticker-keywords.json');
const stickerType = 'gratitude'

async function loadUsableStickerPacks() {
  const result = {
    [stickerType]: {}
  };

  for (const pair of stickerKeywords) {
    if (pair.words.includes("привет")) {
      const stickers = pair.stickers;

      const stickerIds = stickers.map(s => s.sticker_id);
      const productIds = stickers.map(s => s.pack_id);
      console.log(productIds);

      const response = await vk.api.store.getProducts({
        type: "stickers",
        product_ids: productIds,
        extended: true,
      });

      const stickerPacks = response.items;
      for (const stickerPack of stickerPacks) {
        for (const sticker of stickerPack.stickers) {
          if (!stickerIds.includes(sticker.sticker_id)) {
            continue;
          }

          const images = sticker.images.filter(i => i.width == 512 && i.height == 512);
          const imagesWithBackground = sticker.images_with_background.filter(i => i.width == 512 && i.height == 512);

          const typedSticker = {
            id: sticker.sticker_id,
            previewImageUrl: images[0].url,
            previewImageWithBackground: imagesWithBackground[0].url,
            packId: stickerPack.id,
            packTitle: stickerPack.title,
            type: stickerType,
          };

          // if (sticker.render) {
          //   const images = sticker.render.images.filter(i => i.width == 512 && i.height == 512);

          //   const lightImages = images.filter(i => i.theme == "light");
          //   const darkImages = images.filter(i => i.theme == "dark");

          //   typedSticker.render = { 
          //     lightPreviewImageUrl: lightImages[0]?.url,
          //     darkPreviewImageUrl: darkImages[0]?.url,
          //   }
          // }

          result[stickerType][stickerPack.title] = typedSticker;
        }
      }

      saveJsonSync('greeting.json', result);
      console.log('found');
      return;
    }
  }
  return;
}

loadUsableStickerPacks().catch(console.error);