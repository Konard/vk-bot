const { VK } = require('vk-io');
const { getToken } = require('./utils');

/**
 * PersonalityManager handles multiple VK accounts/pages with different personalities
 * Each personality can have its own token, triggers, and behavior patterns
 */
class PersonalityManager {
  constructor(config = {}) {
    this.personalities = new Map();
    this.defaultPersonality = config.defaultPersonality || 'main';
    this.config = config;
    this.triggerPersonalityMap = new Map();

    this.init();
  }

  init() {
    // Load personalities from config
    if (this.config.personalities) {
      for (const [name, personalityConfig] of Object.entries(this.config.personalities)) {
        this.addPersonality(name, personalityConfig);
      }
    }

    // Ensure default personality exists
    if (!this.personalities.has(this.defaultPersonality)) {
      this.addPersonality(this.defaultPersonality, {
        token: getToken(),
        description: 'Main personality',
        triggers: ['*'] // Handle all triggers by default
      });
    }
  }

  /**
   * Add a new personality with its own VK instance and configuration
   * @param {string} name - Personality name
   * @param {Object} config - Personality configuration
   */
  addPersonality(name, config) {
    const token = config.token || getToken(config.tokenFile);
    const vk = new VK({ token });

    const personality = {
      name,
      vk,
      token,
      description: config.description || `${name} personality`,
      triggers: config.triggers || [],
      interests: config.interests || [],
      responseStyle: config.responseStyle || 'default',
      enabled: config.enabled !== false,
      config
    };

    this.personalities.set(name, personality);

    // Map triggers to this personality
    if (config.triggers) {
      for (const triggerName of config.triggers) {
        if (triggerName === '*') {
          // This personality handles all triggers (fallback)
          continue;
        }
        this.triggerPersonalityMap.set(triggerName, name);
      }
    }

    console.log(`Added personality: ${name} - ${personality.description}`);
    return personality;
  }

  /**
   * Get the appropriate personality for a trigger
   * @param {string} triggerName - Name of the trigger
   * @returns {Object} Personality object
   */
  getPersonalityForTrigger(triggerName) {
    // First try to find a specific personality for this trigger
    const personalityName = this.triggerPersonalityMap.get(triggerName);
    if (personalityName && this.personalities.has(personalityName)) {
      const personality = this.personalities.get(personalityName);
      if (personality.enabled) {
        return personality;
      }
    }

    // Fall back to personalities that handle all triggers (*)
    for (const [name, personality] of this.personalities) {
      if (personality.enabled && personality.triggers.includes('*')) {
        return personality;
      }
    }

    // Final fallback to default personality
    return this.personalities.get(this.defaultPersonality);
  }

  /**
   * Get all available personalities
   * @returns {Map} Map of personality name to personality object
   */
  getAllPersonalities() {
    return this.personalities;
  }

  /**
   * Get personality by name
   * @param {string} name - Personality name
   * @returns {Object|null} Personality object or null if not found
   */
  getPersonality(name) {
    return this.personalities.get(name) || null;
  }

  /**
   * Enable or disable a personality
   * @param {string} name - Personality name
   * @param {boolean} enabled - Whether to enable the personality
   */
  setPersonalityEnabled(name, enabled) {
    const personality = this.personalities.get(name);
    if (personality) {
      personality.enabled = enabled;
      console.log(`Personality ${name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get the appropriate VK instance for a trigger
   * @param {string} triggerName - Name of the trigger
   * @returns {Object} VK instance
   */
  getVKForTrigger(triggerName) {
    const personality = this.getPersonalityForTrigger(triggerName);
    return personality ? personality.vk : null;
  }

  /**
   * Start updates for all enabled personalities
   */
  async startAllUpdates() {
    const promises = [];
    for (const [name, personality] of this.personalities) {
      if (personality.enabled) {
        console.log(`Starting updates for personality: ${name}`);
        promises.push(personality.vk.updates.start().catch(error => {
          console.error(`Failed to start updates for personality ${name}:`, error);
        }));
      }
    }
    return Promise.all(promises);
  }

  /**
   * Stop updates for all personalities
   */
  async stopAllUpdates() {
    for (const [name, personality] of this.personalities) {
      try {
        await personality.vk.updates.stop();
        console.log(`Stopped updates for personality: ${name}`);
      } catch (error) {
        console.error(`Failed to stop updates for personality ${name}:`, error);
      }
    }
  }

  /**
   * Get statistics about personalities and their usage
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      totalPersonalities: this.personalities.size,
      enabledPersonalities: 0,
      triggerMappings: this.triggerPersonalityMap.size,
      personalities: {}
    };

    for (const [name, personality] of this.personalities) {
      if (personality.enabled) {
        stats.enabledPersonalities++;
      }

      stats.personalities[name] = {
        enabled: personality.enabled,
        triggerCount: personality.triggers.length,
        description: personality.description
      };
    }

    return stats;
  }
}

module.exports = {
  PersonalityManager
};