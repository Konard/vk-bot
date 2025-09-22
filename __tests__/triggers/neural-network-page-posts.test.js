const { trigger, neuralNetworkPostMessages } = require('../../triggers/neural-network-page-posts');

describe('neural network page posts trigger', () => {
  const triggerDescription = 'neural network page posts trigger';

  it('should have correct trigger structure', () => {
    expect(trigger).toHaveProperty('name');
    expect(trigger).toHaveProperty('action');
    expect(trigger.name).toBe('SendNeuralNetworkPagePosts');
    expect(typeof trigger.action).toBe('function');
  });

  it('should have neural network focused post messages', () => {
    expect(neuralNetworkPostMessages).toBeDefined();
    expect(Array.isArray(neuralNetworkPostMessages)).toBe(true);
    expect(neuralNetworkPostMessages.length).toBeGreaterThan(0);

    // Check that messages contain AI/ML related keywords
    neuralNetworkPostMessages.forEach(message => {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);

      // Should contain at least one AI/ML related term
      const aiTerms = ['нейронн', 'AI', 'machine learning', 'GPT', 'искусственного интеллекта', 'neural'];
      const containsAiTerms = aiTerms.some(term =>
        message.toLowerCase().includes(term.toLowerCase())
      );
      expect(containsAiTerms).toBe(true);
    });
  });

  it('should not execute when no communities are configured', async () => {
    const mockContext = {
      vk: {
        api: {
          wall: {
            get: jest.fn(),
            search: jest.fn(),
            post: jest.fn(),
            delete: jest.fn()
          }
        }
      }
    };

    // Mock console.log to verify the skip message
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await trigger.action(mockContext);

    expect(consoleSpy).toHaveBeenCalledWith(
      trigger.name,
      'No neural network communities configured. Skipping.'
    );

    // VK API should not be called
    expect(mockContext.vk.api.wall.get).not.toHaveBeenCalled();
    expect(mockContext.vk.api.wall.post).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});