# Community-Based Friend Messaging Feature

This feature allows you to automatically send messages or stickers to friends who are members of specific VK communities. The feature includes gender-specific message variations and supports both text messages and stickers.

## 🚀 Features

- **Community Filtering**: Target friends who are members of specific VK communities
- **Gender-Specific Messages**: Different message templates for males, females, and unknown genders
- **Flexible Messaging Options**:
  - Text messages only
  - Stickers only
  - Text messages with stickers
- **Smart Filtering**: Automatically skips deactivated users and users who can't receive messages
- **Rate Limiting**: Built-in delays to respect VK API limits
- **Comprehensive Testing**: Full unit test coverage

## 📁 Files

- `triggers/send-community-messages.js` - Main trigger implementation
- `examples/send-community-messages-example.js` - Usage examples
- `examples/integration-example.js` - Integration with main bot
- `__tests__/send-community-messages.test.js` - Unit tests

## 🎯 Usage Examples

### Basic Text Messages

```javascript
const { executeTrigger } = require('./utils');
const { trigger } = require('./triggers/send-community-messages');

await executeTrigger(trigger, {
  vk,
  options: {
    communityIds: [54530371], // VK community IDs to target
    maxMessages: 10,         // Maximum number of messages to send
    sendStickers: false,     // Send text messages
    includeSticker: false,   // Don't include stickers
    delayBetweenChecks: 1000 // 1 second delay between community checks
  }
});
```

### Stickers Only

```javascript
await executeTrigger(trigger, {
  vk,
  options: {
    communityIds: [54530371, 12345678],
    maxMessages: 5,
    sendStickers: true,      // Send only stickers
    includeSticker: false,   // Ignored when sendStickers is true
    delayBetweenChecks: 500
  }
});
```

### Text Messages with Stickers

```javascript
await executeTrigger(trigger, {
  vk,
  options: {
    communityIds: [54530371],
    maxMessages: 8,
    sendStickers: false,     // Send text messages
    includeSticker: true,    // Include stickers with text
    delayBetweenChecks: 750
  }
});
```

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `communityIds` | number[] | `[]` | Array of VK community IDs to check membership |
| `maxMessages` | number | `10` | Maximum number of messages to send |
| `sendStickers` | boolean | `false` | Send only stickers (no text) |
| `includeSticker` | boolean | `false` | Include stickers with text messages |
| `delayBetweenChecks` | number | `1000` | Delay in milliseconds between community membership checks |

## 💬 Message Templates

The feature includes different message templates based on user gender:

### For Females (sex = 1)
- "Привет! 👋 Как дела, подруга?"
- "Привет, красавица! Как поживаешь? ✨"
- "Привет! Как настроение? 🌸"
- And more...

### For Males (sex = 2)
- "Привет! 👋 Как дела, друг?"
- "Здорово! Как поживаешь? 🤝"
- "Привет, братан! Как успехи? 💪"
- And more...

### Default (sex = 0 or unknown)
- "Привет! 👋 Как дела?"
- "Здорово! Как поживаешь? 😊"
- "Привет! Как настроение? 🌟"
- And more...

## 🎨 Available Stickers

The feature uses a selection of friendly stickers:
- 60302 - General greeting
- 89461 - Good mood
- 92727 - Positive message
- 72627 - Friendly
- 56507 - Happy
- 59429 - Cheerful

## 🔄 Integration with Main Bot

To add this feature to your main bot (index.js), add the following:

```javascript
// Import the trigger
const { trigger: sendCommunityMessagesTrigger } = require('./triggers/send-community-messages');

// Set up periodic execution (every 4 hours)
const sendCommunityMessagesInterval = setInterval(async () => {
  await executeTrigger(sendCommunityMessagesTrigger, {
    vk,
    options: {
      communityIds: [54530371, 12345678], // Your target communities
      maxMessages: 10,
      sendStickers: false,
      includeSticker: true,
      delayBetweenChecks: 1000,
    }
  });
}, (4 * 60 * minute) / ms);
```

## 🧪 Running Tests

```bash
npm test -- __tests__/send-community-messages.test.js
```

## 📊 Test Coverage

The implementation includes comprehensive tests covering:
- ✅ Gender-specific message selection
- ✅ Community membership checking
- ✅ Different messaging modes (text, stickers, combined)
- ✅ Friend filtering (permissions, deactivated accounts)
- ✅ Message limits and rate limiting
- ✅ Error handling

## 🚀 Running Examples

### Run all examples
```bash
node examples/send-community-messages-example.js
```

### Run specific mode
```bash
# Text messages only
node examples/send-community-messages-example.js text 54530371 5

# Stickers only
node examples/send-community-messages-example.js stickers 12345678 3

# Text with stickers
node examples/send-community-messages-example.js combined 87654321 10
```

### Set up continuous campaigns
```bash
node examples/integration-example.js setup
```

## ⚠️ Important Notes

1. **Rate Limiting**: The feature includes built-in delays to respect VK API limits. Adjust `delayBetweenChecks` based on your needs.

2. **Community IDs**: Make sure to use actual VK community IDs. You can find these in the community URL (e.g., vk.com/club123456789 → ID is 123456789).

3. **Permissions**: The bot must have permission to check community membership and send messages to users.

4. **Privacy**: Only friends who can receive private messages will be contacted.

5. **Testing**: Always test with a small `maxMessages` value first to ensure everything works correctly.

## 🛠️ Advanced Configuration

For more complex scenarios, you can create multiple campaigns with different settings:

```javascript
const campaigns = [
  {
    name: 'Developer Community',
    communityIds: [54530371],
    schedule: 6 * 60 * minute, // Every 6 hours
    options: {
      maxMessages: 8,
      sendStickers: false,
      includeSticker: false,
    }
  },
  {
    name: 'Gaming Community',
    communityIds: [12345678, 87654321],
    schedule: 12 * 60 * minute, // Every 12 hours
    options: {
      maxMessages: 5,
      sendStickers: true,
    }
  }
];
```

## 📝 Logs and Monitoring

The feature provides detailed logging:
- Community membership checks
- Message sending progress
- Error handling
- Success statistics

Monitor the console output to track the feature's performance and troubleshoot any issues.

---

**Note**: This feature was implemented to solve [GitHub Issue #70](https://github.com/konard/vk-bot/issues/70) - "Auto send a message or sticker + message to all friends in specific community".