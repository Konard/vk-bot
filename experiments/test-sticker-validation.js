// Test script for sticker validation functionality
const {
  markStickerAsInvalid,
  isStickerInvalid,
  filterValidStickers,
  getRandomValidSticker,
  loadInvalidStickers
} = require('../sticker-validator');

console.log('Testing sticker validation functionality...\n');

// Test 1: Mark a sticker as invalid
console.log('Test 1: Marking sticker 72789 as invalid');
markStickerAsInvalid(72789, 'Test - VK API error code 10');

// Test 2: Check if sticker is invalid
console.log('Test 2: Checking if sticker 72789 is invalid');
console.log('Is 72789 invalid?', isStickerInvalid(72789));
console.log('Is 12345 invalid?', isStickerInvalid(12345));

// Test 3: Filter valid stickers from array
console.log('\nTest 3: Filtering valid stickers from array');
const testStickerIds = [72789, 12345, 67890, 54321];
const validStickers = filterValidStickers(testStickerIds);
console.log('Original array:', testStickerIds);
console.log('Valid stickers:', validStickers);

// Test 4: Get random valid sticker
console.log('\nTest 4: Getting random valid sticker');
const randomValid = getRandomValidSticker(testStickerIds);
console.log('Random valid sticker:', randomValid);

// Test 5: Test with all invalid stickers
console.log('\nTest 5: Testing with all invalid stickers');
markStickerAsInvalid(12345, 'Test invalid');
markStickerAsInvalid(67890, 'Test invalid');
markStickerAsInvalid(54321, 'Test invalid');

const noValidStickers = getRandomValidSticker(testStickerIds);
console.log('Random valid sticker from all invalid list:', noValidStickers);

// Test 6: Load and display invalid stickers
console.log('\nTest 6: Current invalid stickers database');
const invalidStickers = loadInvalidStickers();
console.log('Invalid stickers:', JSON.stringify(invalidStickers, null, 2));

console.log('\n✅ Sticker validation tests completed!');