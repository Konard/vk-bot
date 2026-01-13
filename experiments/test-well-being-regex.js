// Test complete regex pattern
const wellBeingQuestionRegex = /(как)[^\p{L}]+(поживаешь|дела|жизнь)|^[^\p{L}\?]*(how|what)\b[^\p{L}]+(are|is|have|'?s)\b[^\p{L}]+(you|everything|it|things|going|new|up|been)\b.*$|^.*\b(whassup)\b.*$/ui;

const shouldMatch = [
  'Привет как дела😏😏',
  'Whassup?',
  'What\'s up?',
  'How are you?',
  'Как дела?',
  'Как жизнь?',
  'Как поживаешь?',
  'Как дела',
  'How are you',
  'How are you doing?',
  'How have you been?',
  'How\'s everything?',
  'How\'s it going?',
  'How are things going?',
  'What\'s going on?',
  'What\'s new?',
  'What are you up to?'
];

const shouldNotMatch = [
  'Чем занимаешься?',
  'Какая цель добавления в друзья?'
];

console.log('Testing shouldMatch:');
shouldMatch.forEach(test => {
  const matches = wellBeingQuestionRegex.test(test);
  console.log(`"${test}" matches: ${matches} ${matches ? '✓' : '✗ FAIL'}`);
});

console.log('\nTesting shouldNotMatch:');
shouldNotMatch.forEach(test => {
  const matches = wellBeingQuestionRegex.test(test);
  console.log(`"${test}" matches: ${matches} ${!matches ? '✓' : '✗ FAIL'}`);
});
