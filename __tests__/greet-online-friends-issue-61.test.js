// Test for issue #61: TypeError: Cannot read properties of undefined (reading 'action') at greetOnlineFriends

describe('Issue #61 - greetOnlineFriends TypeError', () => {
  test('greeting trigger import should work correctly', () => {
    // This should not throw a TypeError
    const { trigger: greetingTrigger } = require('../triggers/greeting');

    expect(greetingTrigger).toBeDefined();
    expect(greetingTrigger.action).toBeDefined();
    expect(typeof greetingTrigger.action).toBe('function');
    expect(greetingTrigger.name).toBe('GreetingTrigger');
  });

  test('greet-online-friends.js script should exist and provide guidance', () => {
    const fs = require('fs');
    const path = require('path');

    const scriptPath = path.join(__dirname, '../greet-online-friends.js');
    expect(fs.existsSync(scriptPath)).toBe(true);

    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    expect(scriptContent).toContain('greet-friends.js');
    expect(scriptContent).toContain('DEPRECATION WARNING');
  });

  test('greeting trigger action should be callable without TypeError', async () => {
    const { trigger: greetingTrigger } = require('../triggers/greeting');

    // Mock VK API and context to prevent actual API calls
    const mockContext = {
      vk: {
        api: {
          messages: {
            send: jest.fn().mockResolvedValue({ message_id: 123 })
          }
        }
      },
      response: {
        user_id: 12345
      }
    };

    // This should not throw "Cannot read properties of undefined (reading 'action')"
    expect(async () => {
      await greetingTrigger.action(mockContext);
    }).not.toThrow();
  });
});