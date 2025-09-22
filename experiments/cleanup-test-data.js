const fs = require('fs');
const path = require('path');

// Clean up test data created during our experiments
const invalidStickersFile = path.join(__dirname, '..', 'invalid-stickers.json');

console.log('Cleaning up test data...');

try {
  if (fs.existsSync(invalidStickersFile)) {
    // Read the current data
    const data = JSON.parse(fs.readFileSync(invalidStickersFile, 'utf8'));
    console.log('Current invalid stickers:', Object.keys(data));

    // Remove test stickers but keep the problematic 72789 marked as invalid
    const cleanData = {
      '72789': data['72789'] || {
        markedAt: new Date().toISOString(),
        reason: 'VK API error code 10 - Internal server error (from issue #77)'
      }
    };

    fs.writeFileSync(invalidStickersFile, JSON.stringify(cleanData, null, 2));
    console.log('✅ Cleaned up test data. Only keeping sticker 72789 as invalid.');
  } else {
    // Create a fresh file with just the problematic sticker
    const cleanData = {
      '72789': {
        markedAt: new Date().toISOString(),
        reason: 'VK API error code 10 - Internal server error (from issue #77)'
      }
    };

    fs.writeFileSync(invalidStickersFile, JSON.stringify(cleanData, null, 2));
    console.log('✅ Created fresh invalid-stickers.json with only the problematic sticker 72789.');
  }
} catch (error) {
  console.error('Error cleaning up test data:', error);
}

console.log('Cleanup complete!');