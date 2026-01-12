// Test script to demonstrate improved file reading error messages
const { readTextSync, readJsonSync } = require('../utils');

console.log('Testing file reading error handling...\n');

// Test missing file
console.log('1. Testing missing file:');
try {
  readTextSync('nonexistent-file.txt');
} catch (error) {
  console.log('Error:', error.message);
}

console.log('\n2. Testing missing JSON file:');
try {
  readJsonSync('nonexistent-file.json');
} catch (error) {
  console.log('Error:', error.message);
}

// Test invalid JSON
console.log('\n3. Testing invalid JSON:');
try {
  // Create a file with invalid JSON
  const fs = require('fs');
  fs.writeFileSync('experiments/invalid.json', '{ invalid json }');
  readJsonSync('experiments/invalid.json');
} catch (error) {
  console.log('Error:', error.message);
}

console.log('\n4. Testing valid file reading:');
try {
  const content = readTextSync('experiments/test-token');
  console.log('Successfully read:', content);
} catch (error) {
  console.log('Error:', error.message);
}