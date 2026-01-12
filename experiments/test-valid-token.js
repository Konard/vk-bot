// Test script to verify the token reading still works with valid files
const { getToken } = require('../utils');

console.log('Testing with valid token file...');

try {
  const token = getToken('experiments/test-token');
  console.log('Token read successfully:', token);
} catch (error) {
  console.log('Error:', error.message);
}