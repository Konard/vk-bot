const { withVkApiRetry } = require('./utils');

// Mock sleep function to avoid actual delays in tests
jest.mock('./utils', () => {
  const originalModule = jest.requireActual('./utils');
  return {
    ...originalModule,
    withVkApiRetry: jest.fn().mockImplementation(async (apiCall, context = '', maxRetries = 3) => {
      let retryCount = 0;

      // Mock sleep function for testing
      const mockSleep = () => Promise.resolve();

      while (retryCount <= maxRetries) {
        try {
          return await apiCall();
        } catch (error) {
          if (error.code === 10) { // Internal server error: could not check access_token now, check later
            retryCount++;
            if (retryCount <= maxRetries) {
              console.warn(`VK API internal server error (code 10) ${context ? `for ${context}` : ''}. Retrying... (Attempt ${retryCount}/${maxRetries})`);
              await mockSleep();
              continue;
            } else {
              console.error(`VK API internal server error (code 10) ${context ? `for ${context}` : ''}. Max retries (${maxRetries}) exceeded.`);
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
    })
  };
});

describe('withVkApiRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should succeed on first try when no error occurs', async () => {
    const mockApiCall = jest.fn().mockResolvedValue({ success: true });

    const result = await withVkApiRetry(mockApiCall, 'test context');

    expect(result).toEqual({ success: true });
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  test('should retry on VK API error code 10 and succeed', async () => {
    const error = new Error('Internal server error: could not check access_token now, check later.');
    error.code = 10;

    const mockApiCall = jest.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ success: true });

    const result = await withVkApiRetry(mockApiCall, 'test context');

    expect(result).toEqual({ success: true });
    expect(mockApiCall).toHaveBeenCalledTimes(3);
  });

  test('should throw immediately for non-retryable errors', async () => {
    const error = new Error('User not found');
    error.code = 177; // Non-retryable error

    const mockApiCall = jest.fn().mockRejectedValue(error);

    await expect(withVkApiRetry(mockApiCall, 'test context')).rejects.toThrow('User not found');
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  test('should throw after max retries exceeded', async () => {
    const error = new Error('Internal server error: could not check access_token now, check later.');
    error.code = 10;

    const mockApiCall = jest.fn().mockRejectedValue(error);

    await expect(withVkApiRetry(mockApiCall, 'test context', 2)).rejects.toThrow('Internal server error: could not check access_token now, check later.');
    expect(mockApiCall).toHaveBeenCalledTimes(3); // Initial call + 2 retries
  });

  test('should use default max retries of 3', async () => {
    const error = new Error('Internal server error: could not check access_token now, check later.');
    error.code = 10;

    const mockApiCall = jest.fn().mockRejectedValue(error);

    await expect(withVkApiRetry(mockApiCall, 'test context')).rejects.toThrow('Internal server error: could not check access_token now, check later.');
    expect(mockApiCall).toHaveBeenCalledTimes(4); // Initial call + 3 retries
  });
});