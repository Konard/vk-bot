const { NeuralFriendRanker } = require('../neural-friend-ranker');

// Mock TensorFlow.js to avoid heavy dependencies in tests
jest.mock('@tensorflow/tfjs-node', () => ({
  sequential: jest.fn(() => ({
    compile: jest.fn(),
    fit: jest.fn().mockResolvedValue({ history: {} }),
    predict: jest.fn(() => ({
      data: jest.fn().mockResolvedValue([0.8, 0.6, 0.9, 0.3, 0.7])
    })),
    save: jest.fn().mockResolvedValue(true),
    dispose: jest.fn()
  })),
  layers: {
    dense: jest.fn(),
    dropout: jest.fn()
  },
  train: {
    adam: jest.fn()
  },
  tensor2d: jest.fn(() => ({
    dispose: jest.fn()
  })),
  tensor1d: jest.fn(() => ({
    dispose: jest.fn()
  })),
  loadLayersModel: jest.fn().mockResolvedValue({
    predict: jest.fn(() => ({
      data: jest.fn().mockResolvedValue([0.8, 0.6, 0.9, 0.3, 0.7])
    }))
  })
}));

describe('NeuralFriendRanker', () => {
  let ranker;
  let mockFriends;

  beforeEach(() => {
    ranker = new NeuralFriendRanker();
    mockFriends = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        online: true,
        can_write_private_message: true,
        has_photo: true,
        sex: 2,
        deactivated: false,
        bdate: '15.3.1990',
        verified: true,
        last_seen: { time: Math.floor(Date.now() / 1000) - 3600 }, // 1 hour ago
        mutual: { count: 25 }
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        online: false,
        can_write_private_message: true,
        has_photo: false,
        sex: 1,
        deactivated: false,
        bdate: null,
        verified: true,
        last_seen: { time: Math.floor(Date.now() / 1000) - 86400 }, // 1 day ago
        mutual: { count: 5 }
      },
      {
        id: 3,
        first_name: 'Bob',
        last_name: 'Wilson',
        online: true,
        can_write_private_message: false,
        has_photo: true,
        sex: 2,
        deactivated: false,
        bdate: '20.5.1985',
        verified: false,
        last_seen: { time: Math.floor(Date.now() / 1000) - 1800 }, // 30 minutes ago
        mutual: { count: 50 }
      },
      {
        id: 4,
        first_name: 'Alice',
        last_name: 'Brown',
        online: false,
        can_write_private_message: true,
        has_photo: true,
        sex: 1,
        deactivated: true,
        bdate: '10.12.1992',
        verified: false,
        last_seen: { time: Math.floor(Date.now() / 1000) - 604800 }, // 1 week ago
        mutual: { count: 15 }
      },
      {
        id: 5,
        first_name: 'Charlie',
        last_name: 'Davis',
        online: true,
        can_write_private_message: true,
        has_photo: true,
        sex: 2,
        deactivated: false,
        bdate: '25.8.1988',
        verified: true,
        last_seen: { time: Math.floor(Date.now() / 1000) - 300 }, // 5 minutes ago
        mutual: { count: 75 }
      }
    ];
  });

  describe('extractFeatures', () => {
    test('should extract correct features for a friend', () => {
      const friend = mockFriends[0];
      const features = ranker.extractFeatures(friend);

      expect(features).toHaveLength(10);
      expect(features[0]).toBe(1.0); // online
      expect(features[2]).toBe(1.0); // can_write_private_message
      expect(features[3]).toBe(1.0); // has_photo
      expect(features[4]).toBe(1.0); // sex = male
      expect(features[5]).toBe(1.0); // not deactivated
      expect(features[6]).toBe(1.0); // has birthday
      expect(features[9]).toBe(1.0); // verified
    });

    test('should handle missing last_seen data', () => {
      const friend = { ...mockFriends[0], last_seen: null };
      const features = ranker.extractFeatures(friend);

      expect(features[1]).toBe(0.0); // last seen score should be 0
    });

    test('should normalize mutual friends count', () => {
      const friend = { ...mockFriends[0], mutual: { count: 150 } };
      const features = ranker.extractFeatures(friend);

      expect(features[8]).toBe(1.0); // Should cap at 1.0 for counts >= 100
    });
  });

  describe('generateTrainingLabels', () => {
    test('should generate appropriate labels for friends', () => {
      const labels = ranker.generateTrainingLabels(mockFriends);

      expect(labels).toHaveLength(mockFriends.length);
      expect(labels.every(label => label === 0 || label === 1)).toBe(true);

      // Charlie (index 4) should have high score: online, male, has photo, verified, etc.
      expect(labels[4]).toBe(1);

      // Alice (index 3) should have low score: deactivated
      expect(labels[3]).toBe(0);
    });
  });

  describe('heuristicRanking', () => {
    test('should rank friends using heuristic method', () => {
      const ranked = ranker.heuristicRanking(mockFriends);

      expect(ranked).toHaveLength(mockFriends.length);
      expect(ranked[0].neuralScore).toBeGreaterThanOrEqual(ranked[1].neuralScore);

      // Check that all friends have scores
      ranked.forEach(friend => {
        expect(friend.neuralScore).toBeDefined();
        expect(typeof friend.neuralScore).toBe('number');
      });
    });

    test('should prefer online male friends with photos', () => {
      const ranked = ranker.heuristicRanking(mockFriends);

      // Find Charlie (should score high: online, male, has photo, verified)
      const charlie = ranked.find(f => f.first_name === 'Charlie');
      const alice = ranked.find(f => f.first_name === 'Alice'); // deactivated

      expect(charlie.neuralScore).toBeGreaterThan(alice.neuralScore);
    });
  });

  describe('rankFriends', () => {
    test('should rank friends and return sorted list', async () => {
      // Mock the model to return predictable scores
      ranker.model = {
        predict: jest.fn(() => ({
          data: jest.fn().mockResolvedValue([0.8, 0.6, 0.9, 0.3, 0.7])
        }))
      };

      ranker.featureStats = mockFriends[0] ? ranker.extractFeatures(mockFriends[0]).map(() => ({ mean: 0.5, std: 0.2 })) : [];

      const ranked = await ranker.rankFriends(mockFriends);

      expect(ranked).toHaveLength(mockFriends.length);
      expect(ranked[0].neuralScore).toBeGreaterThanOrEqual(ranked[1].neuralScore);

      // Verify all friends have neural scores
      ranked.forEach(friend => {
        expect(friend.neuralScore).toBeDefined();
        expect(typeof friend.neuralScore).toBe('number');
      });
    });

    test('should fallback to heuristic ranking if model fails', async () => {
      // Don't set a model
      ranker.model = null;

      const ranked = await ranker.rankFriends(mockFriends);

      expect(ranked).toHaveLength(mockFriends.length);
      expect(ranked[0].neuralScore).toBeGreaterThanOrEqual(ranked[1].neuralScore);
    });
  });

  describe('normalizeFeatures', () => {
    test('should normalize features using stats', () => {
      const featuresArray = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];

      ranker.calculateFeatureStats(featuresArray);
      const normalized = ranker.normalizeFeatures(featuresArray);

      expect(normalized).toHaveLength(3);
      expect(normalized[0]).toHaveLength(3);

      // Check that normalization was applied
      expect(normalized[0][0]).not.toBe(featuresArray[0][0]);
    });

    test('should handle zero standard deviation', () => {
      const featuresArray = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ];

      ranker.calculateFeatureStats(featuresArray);
      const normalized = ranker.normalizeFeatures(featuresArray);

      expect(normalized[0]).toEqual([1, 1, 1]); // Should remain unchanged when std = 0
    });
  });

  describe('model operations', () => {
    test('should create model with correct architecture', () => {
      const tf = require('@tensorflow/tfjs-node');
      const model = ranker.createModel(10);

      expect(tf.sequential).toHaveBeenCalled();
      expect(model.compile).toHaveBeenCalled();
    });

    test('should handle model saving', async () => {
      ranker.model = {
        save: jest.fn().mockResolvedValue(true)
      };

      await ranker.saveModel('/test/path');
      expect(ranker.model.save).toHaveBeenCalledWith('file:///test/path');
    });

    test('should handle model loading', async () => {
      const tf = require('@tensorflow/tfjs-node');

      await ranker.loadModel('/test/path');
      expect(tf.loadLayersModel).toHaveBeenCalledWith('file:///test/path');
    });
  });
});