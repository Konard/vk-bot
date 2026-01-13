/**
 * Configuration for Neural Reactions System
 * This file contains all the tweakable parameters for the AI-like reaction system
 */

const config = {
  // Rate limiting and frequency control
  rateLimit: {
    maxCommentsPerRun: 5,           // Maximum comments to post in one execution
    maxCommentsPerFriend: 1,        // Maximum comments per friend per day
    minDelayBetweenComments: 30,    // Seconds between comments
    minDelayBetweenFriends: 5,      // Seconds between checking friends
    runInterval: 25,                // Minutes between trigger runs
    commentProbability: 0.3         // Probability of commenting on eligible posts (0.0 - 1.0)
  },

  // Post filtering criteria
  postFilter: {
    maxPostAgeHours: 24,           // Don't comment on posts older than this
    maxExistingComments: 10,       // Don't comment if post has more comments than this
    minTextLength: 5,              // Minimum text length to consider commenting
    skipRepostsFromSelf: true      // Skip reposts from the bot's own posts
  },

  // Neural network scoring weights
  neuralWeights: {
    contextScoreThreshold: 1,      // Minimum context score to trigger context-specific reaction
    multipleKeywordBonus: 1.5,     // Multiplier for posts with multiple matching keywords
    funnyKeywordPriority: 10,      // Priority weight for funny keywords
    attachmentPriority: 5          // Priority weight for posts with attachments
  },

  // Learning and adaptation settings
  learning: {
    trackSuccessfulReactions: true, // Track which reactions get likes/responses
    adaptReactionFrequency: true,  // Adapt frequency based on friend activity
    enableContextEvolution: true   // Allow context keywords to evolve based on usage
  },

  // Safety and spam prevention
  safety: {
    maxCommentsPerDay: 50,         // Global daily comment limit
    cooldownAfterError: 300,       // Seconds to wait after API error
    respectUserPrivacy: true,      // Only comment on public posts
    avoidDuplicateReactions: true  // Don't post same reaction twice to same user
  },

  // Debug and monitoring
  debug: {
    enableLogging: true,           // Enable detailed logging
    logReactionChoices: false,     // Log why specific reactions were chosen
    logFilteringDecisions: false,  // Log why posts were filtered out
    saveAnalytics: true            // Save analytics data for improvement
  }
};

module.exports = config;