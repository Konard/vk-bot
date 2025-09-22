const tf = require('@tensorflow/tfjs-node');
const { DateTime } = require('luxon');

class NeuralFriendRanker {
  constructor() {
    this.model = null;
    this.isTraining = false;
    this.featureStats = null;
  }

  extractFeatures(friend) {
    const features = [];

    // Online status (1 if online, 0 if not)
    features.push(friend.online ? 1.0 : 0.0);

    // Last seen score (0-1, higher for more recent)
    if (friend.last_seen && friend.last_seen.time) {
      const lastSeenTime = DateTime.fromSeconds(friend.last_seen.time);
      const daysSinceLastSeen = DateTime.now().diff(lastSeenTime, 'days').days;
      features.push(Math.max(0, 1 - daysSinceLastSeen / 30)); // Normalize to 0-1 over 30 days
    } else {
      features.push(0.0);
    }

    // Can write private message (1 if yes, 0 if no)
    features.push(friend.can_write_private_message ? 1.0 : 0.0);

    // Has photo (1 if yes, 0 if no)
    features.push(friend.has_photo ? 1.0 : 0.0);

    // Sex preference (adjusted for male preference as seen in friends.js)
    features.push(friend.sex === 2 ? 1.0 : 0.0); // 2 = male in VK API

    // Not deactivated (1 if active, 0 if deactivated)
    features.push(friend.deactivated ? 0.0 : 1.0);

    // Has birthday info (1 if yes, 0 if no)
    features.push(friend.bdate ? 1.0 : 0.0);

    // Has contact info (phone/email)
    const hasContacts = friend.contacts && (friend.contacts.mobile_phone || friend.contacts.home_phone);
    features.push(hasContacts ? 1.0 : 0.0);

    // Mutual friends count (normalized)
    const mutualFriendsCount = friend.mutual ? friend.mutual.count || 0 : 0;
    features.push(Math.min(1.0, mutualFriendsCount / 100)); // Normalize to 0-1, cap at 100

    // Profile verification (1 if verified, 0 if not)
    features.push(friend.verified ? 1.0 : 0.0);

    return features;
  }

  normalizeFeatures(featuresArray) {
    if (!this.featureStats) {
      this.calculateFeatureStats(featuresArray);
    }

    return featuresArray.map(features =>
      features.map((value, index) => {
        const { mean, std } = this.featureStats[index];
        return std > 0 ? (value - mean) / std : value;
      })
    );
  }

  calculateFeatureStats(featuresArray) {
    const numFeatures = featuresArray[0].length;
    this.featureStats = [];

    for (let i = 0; i < numFeatures; i++) {
      const values = featuresArray.map(features => features[i]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      this.featureStats.push({ mean, std });
    }
  }

  createModel(inputSize) {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [inputSize],
          units: 16,
          activation: 'relu',
          kernelInitializer: 'randomNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          kernelInitializer: 'randomNormal'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
          kernelInitializer: 'randomNormal'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  generateTrainingLabels(friends) {
    // Generate synthetic training labels based on heuristics
    return friends.map(friend => {
      let score = 0;

      // Positive factors
      if (friend.online) score += 0.3;
      if (friend.can_write_private_message) score += 0.2;
      if (friend.has_photo) score += 0.1;
      if (friend.sex === 2) score += 0.15; // Male preference
      if (!friend.deactivated) score += 0.2;
      if (friend.bdate) score += 0.05;

      // Last seen bonus
      if (friend.last_seen && friend.last_seen.time) {
        const lastSeenTime = DateTime.fromSeconds(friend.last_seen.time);
        const daysSinceLastSeen = DateTime.now().diff(lastSeenTime, 'days').days;
        if (daysSinceLastSeen < 7) score += 0.1;
      }

      // Mutual friends bonus
      const mutualCount = friend.mutual ? friend.mutual.count || 0 : 0;
      if (mutualCount > 10) score += 0.1;

      // Convert to binary label (threshold at 0.5)
      return score > 0.5 ? 1 : 0;
    });
  }

  async trainModel(friends) {
    if (this.isTraining) {
      console.log('Model is already training, skipping...');
      return;
    }

    this.isTraining = true;
    console.log(`Training neural network with ${friends.length} friends...`);

    try {
      // Extract features for all friends
      const featuresArray = friends.map(friend => this.extractFeatures(friend));

      if (featuresArray.length === 0) {
        console.log('No features to train on');
        return;
      }

      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(featuresArray);

      // Generate training labels
      const labels = this.generateTrainingLabels(friends);

      // Convert to tensors
      const xs = tf.tensor2d(normalizedFeatures);
      const ys = tf.tensor1d(labels);

      // Create or recreate model
      this.model = this.createModel(featuresArray[0].length);

      // Train the model
      const history = await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
          }
        }
      });

      console.log('Training completed successfully');

      // Clean up tensors
      xs.dispose();
      ys.dispose();

    } catch (error) {
      console.error('Error training neural network:', error);
    } finally {
      this.isTraining = false;
    }
  }

  async rankFriends(friends) {
    if (!this.model) {
      console.log('Model not trained yet, training now...');
      await this.trainModel(friends);
    }

    if (!this.model) {
      console.log('Failed to train model, falling back to heuristic ranking');
      return this.heuristicRanking(friends);
    }

    try {
      // Extract and normalize features
      const featuresArray = friends.map(friend => this.extractFeatures(friend));
      const normalizedFeatures = this.normalizeFeatures(featuresArray);

      // Get predictions
      const xs = tf.tensor2d(normalizedFeatures);
      const predictions = await this.model.predict(xs).data();
      xs.dispose();

      // Create ranked list with scores
      const rankedFriends = friends.map((friend, index) => ({
        ...friend,
        neuralScore: predictions[index]
      })).sort((a, b) => b.neuralScore - a.neuralScore);

      console.log(`Ranked ${rankedFriends.length} friends using neural network`);
      console.log(`Top 5 scores: ${rankedFriends.slice(0, 5).map(f => f.neuralScore.toFixed(3)).join(', ')}`);

      return rankedFriends;

    } catch (error) {
      console.error('Error ranking friends with neural network:', error);
      return this.heuristicRanking(friends);
    }
  }

  heuristicRanking(friends) {
    console.log('Using heuristic ranking as fallback');
    return friends.map(friend => {
      let score = 0;

      if (friend.online) score += 0.3;
      if (friend.can_write_private_message) score += 0.2;
      if (friend.has_photo) score += 0.1;
      if (friend.sex === 2) score += 0.15;
      if (!friend.deactivated) score += 0.2;
      if (friend.bdate) score += 0.05;

      return { ...friend, neuralScore: score };
    }).sort((a, b) => b.neuralScore - a.neuralScore);
  }

  async saveModel(modelPath) {
    if (this.model) {
      await this.model.save(`file://${modelPath}`);
      console.log(`Model saved to ${modelPath}`);
    }
  }

  async loadModel(modelPath) {
    try {
      this.model = await tf.loadLayersModel(`file://${modelPath}`);
      console.log(`Model loaded from ${modelPath}`);
    } catch (error) {
      console.log(`Could not load model from ${modelPath}:`, error.message);
    }
  }
}

module.exports = {
  NeuralFriendRanker
};