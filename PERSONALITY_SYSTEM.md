# Personality Separation System

This document describes the personality separation system implemented to address issue #46 - "Separation of interests/areas into different personality pages".

## Overview

The personality separation system allows the VK bot to use different VK accounts (personalities) for different types of interactions. This enables better organization of bot behaviors and allows for specialized responses based on the context or type of conversation.

## Key Features

- **Multiple VK Accounts**: Each personality can use a different VK account/token
- **Trigger Routing**: Different triggers can be handled by different personalities
- **Fallback System**: If a personality is disabled, the system falls back to the main personality
- **Dynamic Configuration**: Personalities can be enabled/disabled without restarting the bot
- **Flexible Configuration**: Easy to configure through the configuration file

## Architecture

### Core Components

1. **PersonalityManager** (`personality-manager.js`) - Main class managing all personalities
2. **Configuration** (`personalities.config.js`) - Defines personalities and their settings
3. **Updated Trigger System** (`utils.js`) - Enhanced to support personality routing
4. **Updated Main Bot** (`index.js`) - Integrated with personality system

### Personality Structure

Each personality has the following properties:

```javascript
{
  name: "personality-name",
  token: "vk-token-or-file-path",
  description: "Description of the personality",
  interests: ["list", "of", "interests"],
  responseStyle: "friendly|warm|playful|helpful|caring",
  triggers: ["TriggerName1", "TriggerName2", "*"],
  enabled: true|false
}
```

## Configuration

### Setting Up Personalities

1. Copy the example configuration:
   ```bash
   cp personalities.example.config.js personalities.config.js
   ```

2. Edit `personalities.config.js` to define your personalities:

```javascript
const personalitiesConfig = {
  defaultPersonality: 'main',
  personalities: {
    main: {
      tokenFile: 'token',
      description: 'Main personality for general interactions',
      triggers: ['*'], // Handles all triggers as fallback
      enabled: true
    },
    social: {
      tokenFile: 'tokens/social-token',
      description: 'Social personality for greetings and gratitude',
      triggers: ['GreetingTrigger', 'GratitudeTrigger'],
      enabled: true
    }
  }
};
```

### Token Management

For each personality, you need:

1. A separate VK account (optional, can reuse main account)
2. A token file containing the VK access token
3. Configure the `tokenFile` path in the personality configuration

#### Token File Structure

Create token files in the following structure:
```
project-root/
├── token                    # Main bot token
├── tokens/
│   ├── social-token         # Social personality token
│   ├── entertainment-token  # Entertainment personality token
│   └── assistant-token      # Assistant personality token
```

## Personality Types

### Pre-configured Personality Categories

1. **Main** - General interactions and fallback
   - Handles: All triggers not assigned to other personalities
   - Style: Friendly and general

2. **Social** - Greetings and social interactions
   - Handles: GreetingTrigger, GratitudeTrigger, WellBeingTrigger
   - Style: Warm and social

3. **Entertainment** - Music and fun content
   - Handles: DoYouLikeThisMusicTrigger, entertainment-related triggers
   - Style: Playful and fun

4. **Assistant** - Questions and help
   - Handles: HowCanIHelpYouTrigger, UndefinedQuestionTrigger
   - Style: Helpful and informative

5. **Relationship** - Friendship interactions
   - Handles: AcquaintanceTrigger, friendship-related triggers
   - Style: Caring and personal

## Usage

### Basic Usage

The personality system works automatically once configured. The bot will:

1. Receive a message
2. Determine which trigger should handle it
3. Route the trigger to the appropriate personality
4. Use that personality's VK account to respond

### Enabling/Disabling Personalities

```javascript
// In your code
personalityManager.setPersonalityEnabled('social', false); // Disable
personalityManager.setPersonalityEnabled('social', true);  // Enable
```

### Getting Statistics

```javascript
const stats = personalityManager.getStats();
console.log('Enabled personalities:', stats.enabledPersonalities);
```

## API Reference

### PersonalityManager

#### Constructor
```javascript
new PersonalityManager(config)
```

#### Methods

- `addPersonality(name, config)` - Add a new personality
- `getPersonalityForTrigger(triggerName)` - Get personality for a specific trigger
- `getPersonality(name)` - Get personality by name
- `setPersonalityEnabled(name, enabled)` - Enable/disable a personality
- `getVKForTrigger(triggerName)` - Get VK instance for a trigger
- `getAllPersonalities()` - Get all personalities
- `getStats()` - Get usage statistics

## Testing

Run the configuration test:
```bash
node experiments/test-personality-config.js
```

This will validate your personality configuration and ensure everything is set up correctly.

## Benefits

1. **Organization**: Different conversation types are handled by appropriate personalities
2. **Scalability**: Easy to add new personalities for new conversation areas
3. **Flexibility**: Can enable/disable personalities as needed
4. **Separation of Concerns**: Each personality can have its own behavior patterns
5. **Multiple Accounts**: Can use different VK accounts for different purposes

## Migration from Single Personality

The system is backward compatible. If you don't configure multiple personalities:

1. The system will use the main personality for all triggers
2. Your existing token file will continue to work
3. All existing functionality remains unchanged

To start using multiple personalities:

1. Set up additional VK accounts (optional)
2. Create token files for each personality
3. Configure `personalities.config.js`
4. Enable the personalities you want to use

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure `npm install` has been run
2. **Token errors**: Check that token files exist and contain valid tokens
3. **Personality not responding**: Check that the personality is enabled
4. **Fallback behavior**: If a personality is disabled, triggers fall back to main

### Debug Information

The system logs personality routing decisions:
```
Using personality 'social' for trigger 'GreetingTrigger'
```

Enable debug logging to see which personality handles each trigger.

## Future Enhancements

Possible future improvements:

1. **Dynamic Personality Creation**: Create personalities at runtime
2. **Personality Learning**: Personalities adapt based on conversation history
3. **Cross-Personality Communication**: Personalities can coordinate responses
4. **Advanced Routing**: Context-aware personality selection
5. **Personality Analytics**: Track which personalities are most effective