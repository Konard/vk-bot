const { VK } = require('vk-io');
const { getToken } = require('../utils');
const { trigger: findDesirableFriendsTrigger } = require('../triggers/find-desirable-friends');

// Example script demonstrating neural network friend ranking
async function runNeuralFriendRankingExample() {
  console.log('🤖 Neural Friend Ranking Example');
  console.log('=================================\n');

  try {
    const token = getToken();
    const vk = new VK({ token });

    console.log('Initializing VK API connection...');

    // Test basic functionality
    const context = {
      vk,
      options: {
        maxResults: 20,        // Get top 20 most desirable friends
        saveResults: true,     // Save results to file
        retrain: false         // Don't retrain if model exists
      }
    };

    console.log('Finding most desirable friends using neural network...\n');

    const startTime = Date.now();
    const topFriends = await findDesirableFriendsTrigger.action(context);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Analysis completed in ${duration}ms`);
    console.log(`Found ${topFriends.length} desirable friends\n`);

    // Display detailed results for top 5
    console.log('📊 Detailed Results (Top 5):');
    console.log('=============================');

    topFriends.slice(0, 5).forEach((friend, index) => {
      console.log(`\n${index + 1}. ${friend.first_name} ${friend.last_name}`);
      console.log(`   ID: ${friend.id}`);
      console.log(`   Neural Score: ${friend.neuralScore.toFixed(4)}`);
      console.log(`   Online: ${friend.online ? '🟢 Yes' : '🔴 No'}`);
      console.log(`   Can Message: ${friend.can_write_private_message ? '✅' : '❌'}`);
      console.log(`   Has Photo: ${friend.has_photo ? '📸' : '❌'}`);
      console.log(`   Verified: ${friend.verified ? '✅' : '❌'}`);

      if (friend.last_seen && friend.last_seen.time) {
        const lastSeen = new Date(friend.last_seen.time * 1000);
        console.log(`   Last Seen: ${lastSeen.toLocaleString()}`);
      }
    });

    // Demonstrate training with retrain option
    console.log('\n\n🧠 Demonstrating Model Retraining:');
    console.log('==================================');

    const retrainContext = {
      vk,
      options: {
        maxResults: 10,
        saveResults: false,
        retrain: true  // Force retraining
      }
    };

    console.log('Retraining neural network model...');
    const retrainedResults = await findDesirableFriendsTrigger.action(retrainContext);
    console.log(`✅ Retrained model and got ${retrainedResults.length} results`);

    console.log('\n🎯 Example completed successfully!');
    console.log('\nTo use this in your bot:');
    console.log('1. Import the trigger: const { trigger } = require("./triggers/find-desirable-friends");');
    console.log('2. Call it with context: await trigger.action({ vk, options: { maxResults: 50 } });');
    console.log('3. Or integrate with greet-friends: orderBy: "neural"');

  } catch (error) {
    console.error('❌ Error running example:', error);

    if (error.message.includes('token')) {
      console.log('\n💡 Make sure you have a valid VK token in the "token" file');
    } else if (error.message.includes('tensorflow')) {
      console.log('\n💡 Make sure you have installed the dependencies: npm install');
    }
  }
}

// Show usage information
console.log('Neural Friend Ranking Example');
console.log('Usage: node examples/neural-friend-ranking-example.js');
console.log('');
console.log('This example demonstrates:');
console.log('- Loading friends data from VK API');
console.log('- Training a neural network to rank friends by desirability');
console.log('- Getting the top most desirable friends');
console.log('- Saving and loading trained models');
console.log('');

// Run if called directly
if (require.main === module) {
  runNeuralFriendRankingExample().catch(console.error);
}

module.exports = { runNeuralFriendRankingExample };