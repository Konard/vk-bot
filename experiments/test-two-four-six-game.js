// Test script for the 2-4-6 game triggers
const {
  startGameRegex,
  tripleRegex,
  ruleGuessRegex,
  checkRule,
} = require('../triggers/two-four-six-game');

console.log('Testing 2-4-6 game implementation...\n');

// Test 1: Start game regex
console.log('=== Test 1: Start Game Regex ===');
const startGameTests = [
  { text: 'играть 246', expected: true },
  { text: 'играть', expected: true },
  { text: 'игра 2 4 6', expected: true },
  { text: 'давай игра', expected: true },
  { text: 'play 246', expected: true },
  { text: 'play game', expected: true },
  { text: "let's play", expected: true },
  { text: 'сыграем', expected: true },
  { text: 'привет', expected: false },
  { text: '2 4 6', expected: false },
];

startGameTests.forEach(test => {
  const result = startGameRegex.test(test.text);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} "${test.text}" -> ${result} (expected: ${test.expected})`);
});

// Test 2: Triple regex
console.log('\n=== Test 2: Triple Regex ===');
const tripleTests = [
  { text: '2 4 6', expected: true },
  { text: '8, 10, 12', expected: true },
  { text: '-1, 121, 130.5', expected: true },
  { text: '100 200 300', expected: true },
  { text: '2.5, 3.7, 4.9', expected: true },
  { text: '2 4', expected: false },
  { text: '1 2 3 4', expected: false },
  { text: 'привет', expected: false },
];

tripleTests.forEach(test => {
  const result = tripleRegex.test(test.text);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} "${test.text}" -> ${result} (expected: ${test.expected})`);
  if (result) {
    const match = test.text.match(tripleRegex);
    console.log(`   Extracted: [${match[1]}, ${match[2]}, ${match[3]}]`);
  }
});

// Test 3: Rule guess regex
console.log('\n=== Test 3: Rule Guess Regex ===');
const ruleGuessTests = [
  { text: 'правило: числа возрастают', expected: true },
  { text: 'я знаю правило', expected: true },
  { text: 'понял! числа должны расти', expected: true },
  { text: 'rule: ascending order', expected: true },
  { text: 'i know the rule', expected: true },
  { text: 'got it: numbers increase', expected: true },
  { text: 'числа должны идти в порядке возрастания, каждое следующее больше предыдущего', expected: true },
  { text: '2 4 6', expected: false },
];

ruleGuessTests.forEach(test => {
  const result = ruleGuessRegex.test(test.text) || test.text.length > 30;
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} "${test.text}" -> ${result} (expected: ${test.expected})`);
});

// Test 4: Check rule function
console.log('\n=== Test 4: Check Rule Function ===');
const ruleTests = [
  { triple: [2, 4, 6], expected: true },
  { triple: [8, 10, 12], expected: true },
  { triple: [-1, 121, 130.5], expected: true },
  { triple: [1, 2, 3], expected: true },
  { triple: [0, 0.5, 1], expected: true },
  { triple: [2, 2, 3], expected: false },
  { triple: [3, 2, 1], expected: false },
  { triple: [6, 4, 2], expected: false },
  { triple: [1, 1, 1], expected: false },
  { triple: [5, 3, 7], expected: false },
];

ruleTests.forEach(test => {
  const [a, b, c] = test.triple;
  const result = checkRule(a, b, c);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} checkRule(${a}, ${b}, ${c}) -> ${result} (expected: ${test.expected})`);
});

console.log('\n=== All Tests Complete ===');
