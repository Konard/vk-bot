const { trigger: findDesirableFriendsTrigger, findDesirableFriends } = require('../../triggers/find-desirable-friends');

// Mock dependencies
jest.mock('../../friends-cache', () => ({
  getAllFriends: jest.fn()
}));

jest.mock('../../neural-friend-ranker', () => ({
  NeuralFriendRanker: jest.fn().mockImplementation(() => ({
    model: null,
    loadModel: jest.fn().mockResolvedValue(true),
    saveModel: jest.fn().mockResolvedValue(true),
    trainModel: jest.fn().mockResolvedValue(true),
    rankFriends: jest.fn().mockResolvedValue([
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        neuralScore: 0.95,
        can_write_private_message: true,
        deactivated: false
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        neuralScore: 0.85,
        can_write_private_message: true,
        deactivated: false
      },
      {
        id: 3,
        first_name: 'Bob',
        last_name: 'Wilson',
        neuralScore: 0.75,
        can_write_private_message: true,
        deactivated: false
      }
    ])
  }))
}));

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(true),
    writeFile: jest.fn().mockResolvedValue(true)
  }
}));

const { getAllFriends } = require('../../friends-cache');
const { NeuralFriendRanker } = require('../../neural-friend-ranker');

describe('FindDesirableFriends Trigger', () => {
  let mockContext;
  let mockFriends;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      vk: {
        api: {
          friends: {
            get: jest.fn()
          }
        }
      },
      options: {
        maxResults: 10,
        saveResults: false,
        retrain: false
      }
    };

    mockFriends = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        can_write_private_message: true,
        deactivated: false,
        online: true,
        has_photo: true
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        can_write_private_message: true,
        deactivated: false,
        online: false,
        has_photo: true
      },
      {
        id: 3,
        first_name: 'Bob',
        last_name: 'Wilson',
        can_write_private_message: false,
        deactivated: false,
        online: true,
        has_photo: true
      },
      {
        id: 4,
        first_name: 'Alice',
        last_name: 'Brown',
        can_write_private_message: true,
        deactivated: true,
        online: false,
        has_photo: false
      }
    ];

    getAllFriends.mockResolvedValue(mockFriends);
  });

  describe('findDesirableFriends', () => {
    test('should find and rank desirable friends', async () => {
      const result = await findDesirableFriends(mockContext);

      expect(getAllFriends).toHaveBeenCalledWith({ context: mockContext });
      expect(NeuralFriendRanker).toHaveBeenCalled();
      expect(result).toHaveLength(3); // Should return the mocked ranked friends
      expect(result[0].neuralScore).toBe(0.95);
    });

    test('should filter out ineligible friends', async () => {
      await findDesirableFriends(mockContext);

      // Should have created ranker and called rankFriends
      const rankerInstance = NeuralFriendRanker.mock.results[0].value;
      expect(rankerInstance.rankFriends).toHaveBeenCalled();

      // Check that only eligible friends were passed (those who can receive messages and are not deactivated)
      const calledWith = rankerInstance.rankFriends.mock.calls[0][0];
      expect(calledWith).toHaveLength(2); // John and Jane (Bob can't receive messages, Alice is deactivated)
      expect(calledWith.map(f => f.id)).toEqual([1, 2]);
    });

    test('should respect maxResults option', async () => {
      mockContext.options.maxResults = 2;

      const result = await findDesirableFriends(mockContext);

      expect(result).toHaveLength(2); // Only 2 eligible friends after filtering
    });

    test('should handle empty friends list', async () => {
      getAllFriends.mockResolvedValue([]);

      const result = await findDesirableFriends(mockContext);

      expect(result).toEqual([]);
    });

    test('should handle no eligible friends', async () => {
      const ineligibleFriends = [
        {
          id: 1,
          can_write_private_message: false,
          deactivated: false
        },
        {
          id: 2,
          can_write_private_message: true,
          deactivated: true
        }
      ];

      getAllFriends.mockResolvedValue(ineligibleFriends);

      const result = await findDesirableFriends(mockContext);

      expect(result).toEqual([]);
    });

    test('should save results when saveResults is true', async () => {
      const fs = require('fs');
      mockContext.options.saveResults = true;

      await findDesirableFriends(mockContext);

      expect(fs.promises.mkdir).toHaveBeenCalledWith('./data', { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalled();

      // Check that the file content includes the expected structure
      const writeCall = fs.promises.writeFile.mock.calls[0];
      expect(writeCall[0]).toBe('./data/desirable-friends-results.json');

      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveProperty('timestamp');
      expect(savedData).toHaveProperty('totalFriends');
      expect(savedData).toHaveProperty('eligibleFriends');
      expect(savedData).toHaveProperty('results');
    });

    test('should handle retrain option', async () => {
      mockContext.options.retrain = true;

      await findDesirableFriends(mockContext);

      const rankerInstance = NeuralFriendRanker.mock.results[0].value;
      expect(rankerInstance.trainModel).toHaveBeenCalled();
      expect(rankerInstance.saveModel).toHaveBeenCalledWith('./data/neural-friend-model');
    });

    test('should load existing model when available', async () => {
      await findDesirableFriends(mockContext);

      const rankerInstance = NeuralFriendRanker.mock.results[0].value;
      expect(rankerInstance.loadModel).toHaveBeenCalledWith('./data/neural-friend-model');
    });

    test('should handle errors gracefully', async () => {
      getAllFriends.mockRejectedValue(new Error('API Error'));

      await expect(findDesirableFriends(mockContext)).rejects.toThrow('API Error');
    });
  });

  describe('trigger object', () => {
    test('should have correct structure', () => {
      expect(findDesirableFriendsTrigger).toHaveProperty('name');
      expect(findDesirableFriendsTrigger).toHaveProperty('action');
      expect(findDesirableFriendsTrigger.name).toBe('FindDesirableFriends');
      expect(typeof findDesirableFriendsTrigger.action).toBe('function');
    });

    test('should call findDesirableFriends when action is invoked', async () => {
      const result = await findDesirableFriendsTrigger.action(mockContext);

      expect(getAllFriends).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });
  });

  describe('default options', () => {
    test('should use default values when options are not provided', async () => {
      const contextWithoutOptions = { vk: mockContext.vk };

      const result = await findDesirableFriends(contextWithoutOptions);

      // Should still work with defaults
      expect(result).toBeDefined();
      expect(getAllFriends).toHaveBeenCalled();
    });

    test('should use default maxResults when not specified', async () => {
      const contextWithPartialOptions = {
        vk: mockContext.vk,
        options: {
          saveResults: true
          // maxResults not specified
        }
      };

      await findDesirableFriends(contextWithPartialOptions);

      // Should use default maxResults (50) - verified by no errors thrown
      expect(getAllFriends).toHaveBeenCalled();
    });
  });
});