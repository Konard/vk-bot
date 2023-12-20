var Iconv = require('iconv').Iconv;

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const hasSticker = (context, stickersIds) => {
  for (const attachment of context?.attachments || []) {
    const stickerId = attachment?.id;
    console.log('stickerId', stickerId);
    return stickersIds.includes(stickerId);
  }
  return false;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const decode = (encoded, encoding = 'cp1251') => {
  var iconv = new Iconv(encoding, 'utf-8');
  const decoded = iconv.convert(encoded).toString();
}

module.exports = {
  getRandomElement,
  hasSticker,
  sleep,
  decode
};