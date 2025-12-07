const { getAllFriends } = require('../friends-cache');
const { NeuralFriendRanker } = require('../neural-friend-ranker');
const { sleep, second, ms } = require('../utils');

async function findDesirableFriends(context) {
  const maxResults = context?.options?.maxResults || 50;
  const saveResults = context?.options?.saveResults || false;
  const retrain = context?.options?.retrain || false;

  console.log(`Finding most desirable friends (top ${maxResults})...`);

  try {
    // Load all friends
    const allFriends = await getAllFriends({ context });
    console.log(`Loaded ${allFriends.length} friends for analysis`);

    // Filter to friends who can receive messages
    const eligibleFriends = allFriends.filter(friend =>
      friend.can_write_private_message && !friend.deactivated
    );
    console.log(`${eligibleFriends.length} friends are eligible for ranking`);

    if (eligibleFriends.length === 0) {
      console.log('No eligible friends found for ranking');
      return [];
    }

    // Initialize neural network ranker
    const ranker = new NeuralFriendRanker();

    // Load existing model if available
    try {
      await ranker.loadModel('./data/neural-friend-model');
    } catch (error) {
      console.log('No existing model found, will train new one');
    }

    // Retrain if requested or no model exists
    if (retrain || !ranker.model) {
      console.log('Training neural network...');
      await ranker.trainModel(eligibleFriends);

      // Save the trained model
      try {
        await ranker.saveModel('./data/neural-friend-model');
      } catch (error) {
        console.log('Could not save model:', error.message);
      }
    }

    // Rank all eligible friends
    const rankedFriends = await ranker.rankFriends(eligibleFriends);

    // Get top results
    const topFriends = rankedFriends.slice(0, maxResults);

    console.log(`\nTop ${topFriends.length} most desirable friends:`);
    topFriends.forEach((friend, index) => {
      console.log(`${index + 1}. ${friend.first_name} ${friend.last_name} (ID: ${friend.id}, Score: ${friend.neuralScore.toFixed(3)})`);
    });

    // Save results if requested
    if (saveResults) {
      const fs = require('fs').promises;
      const resultsPath = './data/desirable-friends-results.json';

      try {
        await fs.mkdir('./data', { recursive: true });
        await fs.writeFile(resultsPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          totalFriends: allFriends.length,
          eligibleFriends: eligibleFriends.length,
          results: topFriends.map(friend => ({
            id: friend.id,
            name: `${friend.first_name} ${friend.last_name}`,
            score: friend.neuralScore,
            online: friend.online,
            lastSeen: friend.last_seen,
            features: {
              canWritePrivateMessage: friend.can_write_private_message,
              hasPhoto: friend.has_photo,
              sex: friend.sex,
              verified: friend.verified,
              hasBirthday: !!friend.bdate
            }
          }))
        }, null, 2));
        console.log(`Results saved to ${resultsPath}`);
      } catch (error) {
        console.error('Error saving results:', error.message);
      }
    }

    return topFriends;

  } catch (error) {
    console.error('Error finding desirable friends:', error);
    throw error;
  }
}

const trigger = {
  name: "FindDesirableFriends",
  action: async (context) => {
    return await findDesirableFriends(context);
  }
};

module.exports = {
  trigger,
  findDesirableFriends
};