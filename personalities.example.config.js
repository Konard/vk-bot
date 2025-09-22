/**
 * Example Personalities Configuration
 *
 * This is an example configuration showing how to set up different personalities
 * for your VK bot. Copy this file to personalities.config.js and customize it
 * for your specific setup.
 */

const personalitiesConfig = {
  // Default personality that handles unspecified triggers
  defaultPersonality: 'main',

  // Personality definitions
  personalities: {
    // Main personality - handles general interactions
    // This is the default personality that uses your main token
    main: {
      tokenFile: 'token', // Uses your main token file
      description: 'Main personality for general interactions',
      interests: ['general', 'default'],
      responseStyle: 'friendly',
      triggers: ['*'], // Handles all triggers as fallback
      enabled: true
    },

    // Example: Social personality
    // Uncomment and configure when you have a separate VK account for social interactions
    /*
    social: {
      tokenFile: 'tokens/social-token', // Create this file with a different account's token
      description: 'Social personality for greetings and gratitude',
      interests: ['greetings', 'social', 'gratitude', 'well-being'],
      responseStyle: 'warm',
      triggers: [
        'GreetingTrigger',
        'GratitudeTrigger',
        'WellBeingTrigger'
      ],
      enabled: true // Set to true when you have configured the token
    },
    */

    // Example: Entertainment personality
    /*
    entertainment: {
      tokenFile: 'tokens/entertainment-token',
      description: 'Entertainment personality for music and fun content',
      interests: ['music', 'entertainment', 'stickers', 'fun'],
      responseStyle: 'playful',
      triggers: [
        'DoYouLikeThisMusicTrigger',
        'StickerTrigger',
        'EntertainmentTrigger'
      ],
      enabled: true
    },
    */

    // Example: Assistant personality
    /*
    assistant: {
      tokenFile: 'tokens/assistant-token',
      description: 'Assistant personality for questions and help',
      interests: ['questions', 'help', 'information', 'assistance'],
      responseStyle: 'helpful',
      triggers: [
        'HowCanIHelpYouTrigger',
        'UndefinedQuestionTrigger',
        'HaveWeTalkedBeforeTrigger'
      ],
      enabled: true
    },
    */
  },

  // Advanced configuration
  advanced: {
    // Whether to allow personality switching during conversation
    allowPersonalitySwitching: true,

    // Cooldown between personality switches (in minutes)
    personalitySwitchCooldown: 5,

    // Whether to log personality switches
    logPersonalitySwitches: true,

    // Fallback behavior when all personalities are disabled
    fallbackToMain: true
  }
};

module.exports = personalitiesConfig;