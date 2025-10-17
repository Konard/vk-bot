const { pipeline } = require('@xenova/transformers');
const { LocalIndex } = require('vectra');
const path = require('path');
const fs = require('fs');

// Singleton instance for the embedding pipeline
let embeddingPipeline = null;

/**
 * Get or create the embedding pipeline
 * Uses Xenova/all-MiniLM-L6-v2 model which generates 384-dimensional embeddings
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model loaded successfully.');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding vector for a given text
 * @param {string} text - The text to generate embedding for
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text must be a non-empty string');
  }

  const extractor = await getEmbeddingPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });

  // Convert tensor to array
  return Array.from(output.data);
}

/**
 * Create or get a vector index for a specific peer
 * @param {number} peerId - The VK peer ID
 * @returns {Promise<LocalIndex>} - The vector index instance
 */
async function getOrCreateIndex(peerId) {
  const indexPath = path.join(__dirname, '.vector-indexes', `peer-${peerId}`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(indexPath)) {
    fs.mkdirSync(indexPath, { recursive: true });
  }

  const index = new LocalIndex(indexPath);

  // Check if index exists, if not create it
  if (!await index.isIndexCreated()) {
    await index.createIndex();
    console.log(`Created new vector index for peer ${peerId}`);
  }

  return index;
}

/**
 * Index messages from history into the vector database
 * @param {number} peerId - The VK peer ID
 * @param {Array} messages - Array of message objects from VK API
 * @returns {Promise<number>} - Number of messages indexed
 */
async function indexMessages(peerId, messages) {
  if (!messages || messages.length === 0) {
    return 0;
  }

  const index = await getOrCreateIndex(peerId);
  let indexedCount = 0;

  for (const message of messages) {
    // Only index messages with text content that are from the peer (not outgoing)
    if (message.text && message.text.trim().length > 0 && message.out === 0) {
      try {
        const vector = await generateEmbedding(message.text);

        await index.insertItem({
          vector: vector,
          metadata: {
            messageId: message.id,
            text: message.text,
            date: message.date,
            peerId: message.peer_id || peerId,
            fromId: message.from_id
          }
        });

        indexedCount++;
      } catch (error) {
        console.error(`Failed to index message ${message.id}:`, error.message);
      }
    }
  }

  console.log(`Indexed ${indexedCount} messages for peer ${peerId}`);
  return indexedCount;
}

/**
 * Search for similar messages in the history
 * @param {number} peerId - The VK peer ID
 * @param {string} queryText - The text to search for similar messages
 * @param {number} topK - Number of top results to return (default: 3)
 * @returns {Promise<Array>} - Array of similar messages with scores
 */
async function searchSimilarMessages(peerId, queryText, topK = 3) {
  if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
    return [];
  }

  const index = await getOrCreateIndex(peerId);

  // Check if index has any items
  const items = await index.listItems();
  if (items.length === 0) {
    console.log(`No messages indexed for peer ${peerId}`);
    return [];
  }

  const queryVector = await generateEmbedding(queryText);

  const results = await index.queryItems(queryVector, topK);

  return results.map(result => ({
    score: result.score,
    message: result.item.metadata
  }));
}

/**
 * Find potential answer suggestions based on the current message
 * This function looks at the message history to find when similar messages were sent before
 * and what responses were given
 * @param {number} peerId - The VK peer ID
 * @param {string} currentMessage - The current incoming message
 * @param {Array} fullHistory - The full message history
 * @param {number} topK - Number of suggestions to return
 * @returns {Promise<Array>} - Array of suggested responses
 */
async function suggestAnswers(peerId, currentMessage, fullHistory, topK = 3) {
  if (!currentMessage || !fullHistory || fullHistory.length === 0) {
    return [];
  }

  // Find similar messages in history
  const similarMessages = await searchSimilarMessages(peerId, currentMessage, topK * 2);

  const suggestions = [];

  for (const similar of similarMessages) {
    // Find the response that was given to this similar message in the history
    const messageIndex = fullHistory.findIndex(msg => msg.id === similar.message.messageId);

    if (messageIndex !== -1 && messageIndex > 0) {
      // Look for the next outgoing message (out === 1) after this message
      for (let i = messageIndex - 1; i >= 0; i--) {
        const potentialResponse = fullHistory[i];
        if (potentialResponse.out === 1 && potentialResponse.text && potentialResponse.text.trim().length > 0) {
          suggestions.push({
            score: similar.score,
            originalMessage: similar.message.text,
            suggestedResponse: potentialResponse.text,
            similarity: similar.score
          });
          break;
        }
      }
    }
  }

  // Remove duplicates and sort by score
  const uniqueSuggestions = suggestions
    .filter((suggestion, index, self) =>
      index === self.findIndex(s => s.suggestedResponse === suggestion.suggestedResponse)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return uniqueSuggestions;
}

/**
 * Clear the index for a specific peer
 * @param {number} peerId - The VK peer ID
 */
async function clearIndex(peerId) {
  const indexPath = path.join(__dirname, '.vector-indexes', `peer-${peerId}`);

  if (fs.existsSync(indexPath)) {
    fs.rmSync(indexPath, { recursive: true, force: true });
    console.log(`Cleared vector index for peer ${peerId}`);
  }
}

module.exports = {
  generateEmbedding,
  getOrCreateIndex,
  indexMessages,
  searchSimilarMessages,
  suggestAnswers,
  clearIndex
};
