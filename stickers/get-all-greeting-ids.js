const stickers = require('greeting.json');
const { saveJsonSync } = require('../utils');

const greetingStickers = stickers['greeting'];

const greetingIds = [];
for (const title in greetingStickers) {
    if (Object.hasOwnProperty.call(object, title)) {
        const sticker = object[title];
        greetingIds.push(sticker.id);
    }
}

saveJsonSync('greeting-ids.json', greetingIds);