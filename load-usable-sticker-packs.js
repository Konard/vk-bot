const { VK } = require('vk-io');
const { sleep } = require('./utils');
const fs = require('fs');
const token = fs.readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

async function loadUsableStickerPacks() {
  // for (let offset = 0; offset < 10000; offset += 5000) {
  const response = await vk.api.store.getProducts({
    type: "stickers",
    // filters: ["purchased", "active"],
    extended: true,
  });

  console.log("getProducts stickers: ", response.items.length)

  const stickerPacks = response.items;
  const usableStickerPacks = {};
  const usableStickers = {};
  for (const stickerPack of stickerPacks) {
    if (stickerPack.purchased && stickerPack.active) {
      if (!usableStickerPacks[stickerPack.id]) {
        delete stickerPack["type"];
        delete stickerPack["purchased"];
        delete stickerPack["active"];
        delete stickerPack["is_new"];
        delete stickerPack["icon"];
        delete stickerPack["previews"];

        for (const sticker of stickerPack.stickers) {
          const images = sticker.images.filter(i => i.width == 512 && i.height == 512);
          const imagesWithBackground = sticker.images_with_background.filter(i => i.width == 512 && i.height == 512);

          if (sticker.inner_type == "base_sticker_new") {
            delete sticker["inner_type"];
          }

          if (sticker.render) {
            const images = sticker.render.images.filter(i => i.width == 512 && i.height == 512);

            const lightImages = images.filter(i => i.theme == "light");
            const darkImages = images.filter(i => i.theme == "dark");

            delete sticker.render["images"];

            sticker.render.lightPreviewImageUrl = lightImages[0]?.url;
            sticker.render.darkPreviewImageUrl = darkImages[0]?.url;
          }

          delete sticker["images"];
          delete sticker["images_with_background"];

          sticker.id = sticker.sticker_id;
          delete sticker.sticker_id;

          sticker.usable = sticker.is_allowed;
          delete sticker.is_allowed;

          sticker.previewImageUrl = images[0].url;
          sticker.previewImageWithBackground = imagesWithBackground[0].url;

          if (!usableStickers[sticker.id]) {
            usableStickers[sticker.id] = sticker;
          }
          sticker.pack = stickerPack.title;
          if (!usableStickers[stickerPack.title]) {
            usableStickers[stickerPack.title] = {}
          }
          if (!usableStickers[stickerPack.title][sticker.id]) {
            usableStickers[stickerPack.title][sticker.id] = sticker;
          }
        }

        stickerPack.usable = true;
        usableStickerPacks[stickerPack.id] = stickerPack;
      }
    }
  }

  const usableStickerPacksJson = JSON.stringify(usableStickerPacks, null, 2);
  fs.writeFileSync("usable-sticker-packs.json", usableStickerPacksJson);
  const usableStickersJson = JSON.stringify(usableStickers, null, 2);
  fs.writeFileSync("usable-stickers.json", usableStickersJson);
  // }
}

loadUsableStickerPacks().catch(console.error);