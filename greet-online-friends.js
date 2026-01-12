// This script has been replaced by greet-friends.js
// This is a compatibility wrapper to prevent the TypeError issue #61

console.log('⚠️  DEPRECATION WARNING: greet-online-friends.js has been replaced by greet-friends.js');
console.log('📄 Please use: node greet-friends.js [max_friends_to_greet]');
console.log('🔗 For more options: node greet-friends.js --help');
console.log('');

const maxFriendsToGreet = Number(process.argv[2]) || 0;

if (maxFriendsToGreet > 0) {
  console.log(`🔄 Redirecting to greet-friends.js with ${maxFriendsToGreet} friends limit...`);

  // Spawn the new script with the same arguments
  const { spawn } = require('child_process');
  const child = spawn('node', ['greet-friends.js', maxFriendsToGreet.toString()], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
} else {
  console.log('ℹ️  Usage: node greet-online-friends.js <max_friends_to_greet>');
  console.log('ℹ️  Example: node greet-online-friends.js 5');
  console.log('');
  console.log('🚀 Or use the new script directly:');
  console.log('   node greet-friends.js <max_friends_to_greet>');
  console.log('   node greet-friends.js --order-by total-friends <max_friends_to_greet>');
}