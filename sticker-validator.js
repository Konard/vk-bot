const { readJsonSync, saveJsonSync } = require('./utils');
const fs = require('fs');

const INVALID_STICKERS_FILE = 'invalid-stickers.json';

/**
 * Load the list of known invalid stickers
 */
function loadInvalidStickers() {
  try {
    return readJsonSync(INVALID_STICKERS_FILE);
  } catch (error) {
    // File doesn't exist or is invalid, return empty object
    return {};
  }
}

/**
 * Save a sticker ID as invalid
 */
function markStickerAsInvalid(stickerId, reason = 'API error code 10') {
  const invalidStickers = loadInvalidStickers();
  invalidStickers[stickerId] = {
    markedAt: new Date().toISOString(),
    reason: reason
  };

  try {
    saveJsonSync(INVALID_STICKERS_FILE, invalidStickers);
    console.log(`Sticker ${stickerId} marked as invalid and saved to ${INVALID_STICKERS_FILE}`);
  } catch (error) {
    console.error(`Failed to save invalid sticker ${stickerId}:`, error);
  }
}

/**
 * Check if a sticker is known to be invalid
 */
function isStickerInvalid(stickerId) {
  const invalidStickers = loadInvalidStickers();
  return stickerId in invalidStickers;
}

/**
 * Filter out invalid stickers from an array of sticker IDs
 */
function filterValidStickers(stickerIds) {
  const invalidStickers = loadInvalidStickers();
  const validStickers = stickerIds.filter(id => !(id in invalidStickers));

  const filteredCount = stickerIds.length - validStickers.length;
  if (filteredCount > 0) {
    console.log(`Filtered out ${filteredCount} invalid stickers from list of ${stickerIds.length}`);
  }

  return validStickers;
}

/**
 * Get a random valid sticker from an array, avoiding known invalid ones
 */
function getRandomValidSticker(stickerIds) {
  const validStickers = filterValidStickers(stickerIds);

  if (validStickers.length === 0) {
    console.warn('No valid stickers available in the provided list');
    return null;
  }

  return validStickers[Math.floor(Math.random() * validStickers.length)];
}

module.exports = {
  loadInvalidStickers,
  markStickerAsInvalid,
  isStickerInvalid,
  filterValidStickers,
  getRandomValidSticker
};