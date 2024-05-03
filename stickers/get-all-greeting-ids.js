const stickers = require('./greeting.json');
const { saveJsonSync } = require('../utils');

const greetingStickers = stickers['greeting'];

const greetingIds = [];
for (const title in greetingStickers) {
    if (Object.hasOwnProperty.call(greetingStickers, title)) {
        const sticker = greetingStickers[title];
        greetingIds.push(sticker.id);
    }
}

saveJsonSync('greeting-ids.json', greetingIds);