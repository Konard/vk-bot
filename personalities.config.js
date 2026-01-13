/**
 * Personalities Configuration
 *
 * This file defines different personalities for the VK bot.
 * Each personality can have its own VK account/token and handle specific types of interactions.
 */

const personalitiesConfig = {
  // Default personality that handles unspecified triggers
  defaultPersonality: 'main',

  // Personality definitions
  personalities: {
    // Main personality - handles general interactions
    main: {
      tokenFile: 'token', // Default token file
      description: 'Main personality for general interactions',
      interests: ['general', 'default'],
      responseStyle: 'friendly',
      triggers: ['*'], // Handles all triggers as fallback
      enabled: true
    },

    // Social personality - handles greetings, gratitude, well-being
    social: {
      tokenFile: 'tokens/social-token', // Optional: separate token file
      description: 'Social personality for greetings and gratitude',
      interests: ['greetings', 'social', 'gratitude', 'well-being'],
      responseStyle: 'warm',
      triggers: [
        'GreetingTrigger',
        'GratitudeTrigger',
        'WellBeingTrigger'
      ],
      enabled: false // Disabled by default - enable when you have a separate account
    },

    // Entertainment personality - handles music, stickers, fun interactions
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
      enabled: false
    },

    // Assistant personality - handles questions, help, information
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
      enabled: false
    },

    // Relationship personality - handles friendship, acquaintance interactions
    relationship: {
      tokenFile: 'tokens/relationship-token',
      description: 'Relationship personality for friendship interactions',
      interests: ['friendship', 'relationships', 'acquaintance'],
      responseStyle: 'caring',
      triggers: [
        'AcquaintanceTrigger',
        'EngageWithAcquaintanceTrigger',
        'WhoSingularTrigger',
        'WhoMultipleTrigger'
      ],
      enabled: false
    }
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