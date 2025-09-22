// Create a simplified version of the retry function for testing
async function withFloodControlRetryTest(apiCall, maxRetries = 3, triggerName = 'Unknown') {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 9) { // Flood control error
        if (retryCount === maxRetries) {
          console.error(`Maximum retry attempts (${maxRetries}) reached for trigger '${triggerName}' due to flood control. Giving up.`);
          throw error;
        }

        console.warn(`Flood control error (code 9) in trigger '${triggerName}'. Retry ${retryCount + 1}/${maxRetries + 1}`);
        retryCount++;
      } else {
        // For non-flood control errors, throw immediately
        throw error;
      }
    }
  }
}

describe('flood control retry mechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  test('should retry on flood control error (code 9) and succeed', async () => {
    let attemptCount = 0;
    const mockApiCall = jest.fn(() => {
      attemptCount++;
      if (attemptCount <= 2) {
        const error = new Error('Flood control');
        error.code = 9;
        throw error;
      }
      return { success: true, data: 'test response' };
    });

    const result = await withFloodControlRetryTest(mockApiCall, 3, 'TestTrigger');

    expect(mockApiCall).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true, data: 'test response' });
    expect(console.warn).toHaveBeenCalledTimes(2); // Two retry warnings
  });

  test('should fail after max retries on flood control error', async () => {
    const mockApiCall = jest.fn(() => {
      const error = new Error('Flood control');
      error.code = 9;
      throw error;
    });

    await expect(withFloodControlRetryTest(mockApiCall, 2, 'TestTrigger')).rejects.toThrow('Flood control');

    expect(mockApiCall).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(console.warn).toHaveBeenCalledTimes(2); // Two retry warnings
    expect(console.error).toHaveBeenCalledWith(
      'Maximum retry attempts (2) reached for trigger \'TestTrigger\' due to flood control. Giving up.'
    );
  });

  test('should not retry on non-flood control errors', async () => {
    const mockApiCall = jest.fn(() => {
      const error = new Error('Other error');
      error.code = 123;
      throw error;
    });

    await expect(withFloodControlRetryTest(mockApiCall, 3, 'TestTrigger')).rejects.toThrow('Other error');

    expect(mockApiCall).toHaveBeenCalledTimes(1); // Only one call
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  test('should succeed immediately if no error', async () => {
    const mockApiCall = jest.fn(() => ({ success: true }));

    const result = await withFloodControlRetryTest(mockApiCall, 3, 'TestTrigger');

    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
    expect(console.warn).not.toHaveBeenCalled();
  });
});