// Test script to demonstrate the improved token error message
const { getToken } = require('../utils');

console.log('Testing token error handling...');
console.log('Attempting to read token file...');

try {
  const token = getToken();
  console.log('Token found successfully!');
} catch (error) {
  console.log('Error caught and displayed with helpful message:');
  console.log('---');
  console.log(error.message);
  console.log('---');
  console.log('This is much better than the raw ENOENT error!');
}