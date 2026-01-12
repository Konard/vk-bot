const { retryApiCall } = require('../triggers/accept-friend-requests');

describe('Accept Friend Requests - Retry Logic', () => {
  jest.setTimeout(30000); // Increase timeout for retry tests

  test('should retry on AbortError and succeed on third attempt', async () => {
    let attemptCount = 0;

    const mockApiCall = jest.fn(() => {
      attemptCount++;
      if (attemptCount < 3) {
        const error = new Error('The operation was aborted.');
        error.type = 'aborted';
        throw error;
      }
      return { success: true, attempts: attemptCount };
    });

    const result = await retryApiCall(mockApiCall);

    expect(result).toEqual({ success: true, attempts: 3 });
    expect(mockApiCall).toHaveBeenCalledTimes(3);
  });

  test('should handle network timeout errors', async () => {
    let attemptCount = 0;

    const mockApiCall = jest.fn(() => {
      attemptCount++;
      if (attemptCount < 2) {
        const error = new Error('Request timeout');
        error.code = 'ETIMEDOUT';
        throw error;
      }
      return { success: true };
    });

    const result = await retryApiCall(mockApiCall);

    expect(result).toEqual({ success: true });
    expect(mockApiCall).toHaveBeenCalledTimes(2);
  });

  test('should not retry on non-retryable errors', async () => {
    const mockApiCall = jest.fn(() => {
      const error = new Error('API Error');
      error.code = 177; // VK API error code
      throw error;
    });

    await expect(retryApiCall(mockApiCall)).rejects.toMatchObject({
      code: 177
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  test('should fail after max retries exceeded', async () => {
    const mockApiCall = jest.fn(() => {
      const error = new Error('The operation was aborted.');
      error.type = 'aborted';
      throw error;
    });

    await expect(retryApiCall(mockApiCall)).rejects.toMatchObject({
      type: 'aborted'
    });

    expect(mockApiCall).toHaveBeenCalledTimes(3); // maxRetries = 3
  });

  test('should handle AbortError message variations', async () => {
    let attemptCount = 0;

    const mockApiCall = jest.fn(() => {
      attemptCount++;
      if (attemptCount === 1) {
        const error = new Error('AbortError: The operation was aborted.');
        throw error;
      }
      return { success: true };
    });

    const result = await retryApiCall(mockApiCall);

    expect(result).toEqual({ success: true });
    expect(mockApiCall).toHaveBeenCalledTimes(2);
  });
});