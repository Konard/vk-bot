# Neural Friend Ranking

This feature implements a neural network to find the most desirable friends based on various profile characteristics and interaction patterns.

## Overview

The neural friend ranking system uses TensorFlow.js to analyze friend data and rank them by desirability. It considers multiple factors including:

- Online status and activity
- Profile completeness (photo, birthday, contact info)
- Communication permissions
- Verification status
- Mutual connections
- Gender preferences

## Components

### 1. NeuralFriendRanker Class (`neural-friend-ranker.js`)

Core machine learning component that:
- Extracts features from friend profiles
- Trains a neural network model
- Ranks friends based on predicted desirability scores
- Provides fallback heuristic ranking

**Key Methods:**
- `extractFeatures(friend)` - Converts friend data to numerical features
- `trainModel(friends)` - Trains the neural network
- `rankFriends(friends)` - Returns friends ranked by desirability
- `saveModel(path)` / `loadModel(path)` - Model persistence

### 2. Find Desirable Friends Trigger (`triggers/find-desirable-friends.js`)

Standalone trigger for finding and ranking friends:
- Loads friend data from VK API
- Filters eligible friends
- Trains/loads neural network model
- Returns top ranked friends
- Optionally saves results to file

### 3. Enhanced Greet Friends Trigger

Updated `greet-friends.js` to support neural ranking with `orderBy: 'neural'` option.

## Feature Engineering

The neural network analyzes 10 key features:

1. **Online Status** (0-1): Is the friend currently online
2. **Last Seen Score** (0-1): How recently the friend was active
3. **Can Write Messages** (0-1): Permission to send private messages
4. **Has Photo** (0-1): Profile photo availability
5. **Gender Preference** (0-1): Based on existing bot preferences
6. **Active Account** (0-1): Not deactivated/banned
7. **Has Birthday** (0-1): Birthday information available
8. **Contact Info** (0-1): Phone or email available
9. **Mutual Friends** (0-1): Normalized count of mutual connections
10. **Verified Account** (0-1): VK verification status

## Usage

### Direct API Usage

```javascript
const { NeuralFriendRanker } = require('./neural-friend-ranker');

const ranker = new NeuralFriendRanker();
const rankedFriends = await ranker.rankFriends(friendsArray);
console.log('Top friend:', rankedFriends[0]);
```

### Using the Trigger

```javascript
const { trigger } = require('./triggers/find-desirable-friends');

const context = {
  vk: vkInstance,
  options: {
    maxResults: 50,
    saveResults: true,
    retrain: false
  }
};

const topFriends = await trigger.action(context);
```

### Integration with Greet Friends

```javascript
// In your bot configuration
const context = {
  vk: vkInstance,
  options: {
    maxGreetings: 20,
    orderBy: 'neural'  // Use neural network ranking
  }
};

await greetFriendsTrigger.action(context);
```

### Example Script

Run the example script to see the feature in action:

```bash
node examples/neural-friend-ranking-example.js
```

## Neural Network Architecture

- **Input Layer**: 10 features (normalized)
- **Hidden Layer 1**: 16 neurons, ReLU activation, 20% dropout
- **Hidden Layer 2**: 8 neurons, ReLU activation
- **Output Layer**: 1 neuron, sigmoid activation (0-1 desirability score)

**Training Parameters:**
- Optimizer: Adam (learning rate: 0.001)
- Loss: Binary cross-entropy
- Epochs: 50
- Batch size: 32
- Validation split: 20%

## Model Persistence

Models are automatically saved to `./data/neural-friend-model/` and reloaded on subsequent runs. This avoids retraining on every execution.

## Training Data

The system uses synthetic training labels based on heuristic scoring:
- Positive factors: Online, can message, has photo, male gender, active account
- Bonus factors: Recent activity, mutual friends, verification
- Threshold: 0.5 for binary classification

## Configuration Options

### FindDesirableFriends Options

- `maxResults` (default: 50): Number of top friends to return
- `saveResults` (default: false): Save results to JSON file
- `retrain` (default: false): Force model retraining

### GreetFriends Integration

- `orderBy: 'neural'`: Use neural network ranking
- `orderBy: 'total-friends'`: Sort by friend count
- `orderBy: 'default'`: Original sorting logic

## Files Created/Modified

### New Files
- `neural-friend-ranker.js` - Core ML functionality
- `triggers/find-desirable-friends.js` - Standalone trigger
- `examples/neural-friend-ranking-example.js` - Demo script
- `__tests__/neural-friend-ranker.test.js` - Unit tests
- `__tests__/triggers/find-desirable-friends.test.js` - Integration tests

### Modified Files
- `package.json` - Added TensorFlow.js dependency
- `triggers/greet-friends.js` - Added neural ranking option

## Testing

Run the test suite:

```bash
# Test neural ranker
npm test -- neural-friend-ranker.test.js

# Test trigger functionality
npm test -- find-desirable-friends.test.js

# Run all tests
npm test
```

## Performance Considerations

- **Training Time**: ~2-5 seconds for 1000+ friends
- **Inference Time**: ~100ms for ranking 1000+ friends
- **Memory Usage**: ~50MB additional for TensorFlow.js
- **Model Size**: ~50KB saved model files

## Future Enhancements

Potential improvements:
1. **Reinforcement Learning**: Learn from actual interaction outcomes
2. **Feature Engineering**: Add conversation history analysis
3. **Ensemble Models**: Combine multiple ranking approaches
4. **Real-time Updates**: Incrementally update model with new data
5. **A/B Testing**: Compare neural vs heuristic ranking effectiveness

## Troubleshooting

**Common Issues:**

1. **Missing Dependencies**: Run `npm install` to install TensorFlow.js
2. **Training Failures**: Check friend data format and availability
3. **Model Loading Errors**: Ensure `./data/` directory exists and is writable
4. **Low Scores**: Review feature extraction logic for your specific use case

**Debug Mode:**
Set `console.log` level to see detailed training progress and feature analysis.