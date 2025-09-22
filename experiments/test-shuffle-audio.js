const { shuffleArray } = require('../utils');

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

console.log('Original array:', audioAttachments);

// Test multiple shuffles to ensure randomness
for (let i = 0; i < 10; i++) {
  const shuffled = shuffleArray(audioAttachments);
  console.log(`Shuffle ${i + 1}:`, shuffled);
  console.log(`Joined:`, shuffled.join(','));
}

// Test that original array is not modified
console.log('Original array after shuffles:', audioAttachments);

// Test with single element
console.log('Single element test:', shuffleArray(['audio1']));

// Test with empty array
console.log('Empty array test:', shuffleArray([]));