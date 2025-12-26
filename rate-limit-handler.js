const { sleep, minute, ms } = require('./utils');

/**
 * Global rate limit handler for VK API calls
 * Wraps VK API calls to handle rate limits gracefully
 */
class RateLimitHandler {
  constructor() {
    this.isRateLimited = false;
    this.rateLimitUntil = null;
  }

  /**
   * Executes a VK API call with automatic rate limit handling
   * @param {Function} apiCall - The VK API call function
   * @param {Object} options - Options for the API call
   * @param {string} logContext - Context for logging (e.g., 'friend request', 'message send')
   * @returns {Promise} - Result of the API call or null if rate limited
   */
  async executeWithRateLimit(apiCall, options = {}, logContext = 'API call') {
    // Check if we're currently rate limited
    if (this.isRateLimited && this.rateLimitUntil && Date.now() < this.rateLimitUntil) {
      const remainingTime = Math.ceil((this.rateLimitUntil - Date.now()) / 1000);
      console.log(`Rate limit still active for ${logContext}. Skipping for ${remainingTime} more seconds.`);
      return null;
    }

    try {
      const result = await apiCall(options);
      // Reset rate limit status on successful call
      this.isRateLimited = false;
      this.rateLimitUntil = null;
      return result;
    } catch (error) {
      if (error.code === 29) { // Rate limit reached
        console.log(`Rate limit reached for ${logContext}. Pausing all API calls for 1 minute.`);
        this.isRateLimited = true;
        this.rateLimitUntil = Date.now() + (1 * minute);

        // Sleep for 1 minute before allowing any more API calls
        await sleep((1 * minute) / ms);

        return null;
      } else {
        // Re-throw non-rate-limit errors
        throw error;
      }
    }
  }

  /**
   * Check if currently rate limited
   * @returns {boolean}
   */
  isCurrentlyRateLimited() {
    return this.isRateLimited && this.rateLimitUntil && Date.now() < this.rateLimitUntil;
  }

  /**
   * Get remaining rate limit time in seconds
   * @returns {number} - Seconds remaining, or 0 if not rate limited
   */
  getRemainingLimitTime() {
    if (!this.isCurrentlyRateLimited()) {
      return 0;
    }
    return Math.ceil((this.rateLimitUntil - Date.now()) / 1000);
  }
}

// Export a singleton instance
const rateLimitHandler = new RateLimitHandler();

module.exports = {
  RateLimitHandler,
  rateLimitHandler
};