const { trigger: setOnlineStatusTrigger } = require('../../triggers/set-online-status');

describe('set online status trigger', () => {
  let mockVkApi;
  let consoleLogSpy;

  beforeEach(() => {
    mockVkApi = {
      api: {
        account: {
          setOnline: jest.fn()
        }
      }
    };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('successfully sets online status', async () => {
    mockVkApi.api.account.setOnline.mockResolvedValue();

    const context = { vk: mockVkApi };
    await setOnlineStatusTrigger.action(context);

    expect(mockVkApi.api.account.setOnline).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('Online status is set');
  });

  test('retries on VK API error code 10 and eventually succeeds', async () => {
    // Mock timers to speed up the test
    jest.useFakeTimers();

    const error = new Error('Internal server error: Unknown error, try later');
    error.code = 10;

    mockVkApi.api.account.setOnline
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue();

    const context = { vk: mockVkApi };

    // Start the action without waiting
    const actionPromise = setOnlineStatusTrigger.action(context);

    // Fast-forward through all timers
    await jest.runAllTimersAsync();

    // Now wait for the action to complete
    await actionPromise;

    expect(mockVkApi.api.account.setOnline).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy).toHaveBeenCalledWith('Online status is set');

    jest.useRealTimers();
  }, 10000);

  test('does not retry on non-retriable error codes', async () => {
    const error = new Error('Access denied');
    error.code = 5;

    mockVkApi.api.account.setOnline.mockRejectedValue(error);

    const context = { vk: mockVkApi };
    await setOnlineStatusTrigger.action(context);

    expect(mockVkApi.api.account.setOnline).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('Could not set online status', error);
  });

  test('stops retrying after max attempts and logs final error', async () => {
    // Mock timers to speed up the test
    jest.useFakeTimers();

    const error = new Error('Internal server error: Unknown error, try later');
    error.code = 10;

    mockVkApi.api.account.setOnline.mockRejectedValue(error);

    const context = { vk: mockVkApi };

    // Start the action without waiting
    const actionPromise = setOnlineStatusTrigger.action(context);

    // Fast-forward through all timers
    await jest.runAllTimersAsync();

    // Now wait for the action to complete
    await actionPromise;

    // Should try initial call + 3 retries = 4 total calls
    expect(mockVkApi.api.account.setOnline).toHaveBeenCalledTimes(4);
    expect(consoleLogSpy).toHaveBeenCalledWith('Could not set online status', error);

    jest.useRealTimers();
  }, 10000);

  test('has correct trigger name', () => {
    expect(setOnlineStatusTrigger.name).toBe('SetOnlineStatus');
  });

  test('trigger action is defined', () => {
    expect(typeof setOnlineStatusTrigger.action).toBe('function');
  });
});