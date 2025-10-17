/**
 * Vector search utility for finding messages similar to those matching regex patterns
 */
class MessageVectorSearch {
  constructor() {
    this.db = null;
    this.messageCache = new Map(); // Cache for message text by ID
    this.isInitialized = false;
  }

  /**
   * Initialize the vector database (async)
   */
  async init() {
    if (this.isInitialized) {
      return;
    }
    const { default: VectorDB } = await import('@themaximalist/vectordb.js');
    this.db = new VectorDB({
      size: 1000, // Store up to 1000 message embeddings per peer
    });
    this.isInitialized = true;
  }

  /**
   * Add a message to the vector database
   * @param {string} messageId - Unique identifier for the message
   * @param {string} text - Message text content
   * @param {Object} metadata - Additional metadata (peerId, timestamp, etc.)
   */
  async addMessage(messageId, text, metadata = {}) {
    await this.init();

    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      // VectorDB.add takes (input, object) - input is the text to embed, object is metadata
      await this.db.add(text, {
        id: messageId,
        text: text,
        ...metadata
      });
      this.messageCache.set(messageId, text);
    } catch (error) {
      console.error('Error adding message to vector database:', error);
    }
  }

  /**
   * Find messages similar to those that match a regex pattern
   * @param {Array} messages - Array of message objects to search through
   * @param {RegExp} regex - Regular expression pattern to match
   * @param {number} topK - Number of similar messages to return
   * @returns {Promise<Array>} Array of similar messages with similarity scores
   */
  async findSimilarToRegexMatches(messages, regex, topK = 5) {
    await this.init();

    if (!messages || messages.length === 0) {
      return [];
    }

    // Find messages that match the regex
    const matchingMessages = messages.filter(msg => {
      return msg.text && regex.test(msg.text);
    });

    if (matchingMessages.length === 0) {
      return [];
    }

    // Get a representative message (first match) to search for similar ones
    const queryText = matchingMessages[0].text;

    try {
      // Search for similar messages - VectorDB returns { input, distance, object }
      const results = await this.db.search(queryText, topK + matchingMessages.length);

      // Filter out exact regex matches to get only semantically similar ones
      const similarMessages = results
        .filter(result => {
          // Exclude messages that already match the regex
          return result.input && !regex.test(result.input);
        })
        .slice(0, topK)
        .map(result => ({
          text: result.input,
          score: 1 - result.distance, // Convert distance to similarity score
          ...result.object
        }));

      return similarMessages;
    } catch (error) {
      console.error('Error searching for similar messages:', error);
      return [];
    }
  }

  /**
   * Find messages similar to a given text query
   * @param {string} queryText - Text to search for similar messages
   * @param {number} topK - Number of similar messages to return
   * @returns {Promise<Array>} Array of similar messages with similarity scores
   */
  async findSimilar(queryText, topK = 5) {
    await this.init();

    if (!queryText || queryText.trim().length === 0) {
      return [];
    }

    try {
      const results = await this.db.search(queryText, topK);
      return results.map(result => ({
        text: result.input,
        score: 1 - result.distance, // Convert distance to similarity score
        ...result.object
      }));
    } catch (error) {
      console.error('Error searching for similar messages:', error);
      return [];
    }
  }

  /**
   * Index a batch of messages from history
   * @param {Array} messages - Array of message objects
   * @param {string} peerId - Peer ID for metadata
   */
  async indexMessageHistory(messages, peerId) {
    await this.init();

    if (!messages || messages.length === 0) {
      return;
    }

    for (const msg of messages) {
      if (msg.text && msg.text.trim().length > 0) {
        const messageId = `${peerId}_${msg.id}`;
        await this.addMessage(messageId, msg.text, {
          peerId: peerId,
          messageId: msg.id,
          timestamp: msg.date,
          isOutgoing: msg.out === 1
        });
      }
    }
  }

  /**
   * Clear the vector database
   */
  async clear() {
    const { default: VectorDB } = await import('@themaximalist/vectordb.js');
    this.db = new VectorDB({
      size: 1000,
    });
    this.messageCache.clear();
    this.isInitialized = true;
  }
}

module.exports = {
  MessageVectorSearch
};
