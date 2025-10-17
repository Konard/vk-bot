const { indexMessages, suggestAnswers } = require('../vector-search');
const { DateTime } = require('luxon');

const trigger = {
  name: "SuggestAnswerTrigger",
  condition: (context) => {
    // Only trigger for user messages (not group chats)
    if (context.request.peerType !== "user") {
      return false;
    }

    // Only trigger for incoming messages (not outgoing)
    if (context?.request?.isOutbox) {
      return false;
    }

    // Only trigger if there's message text
    if (!context?.request?.text || context.request.text.trim().length === 0) {
      return false;
    }

    // Only trigger once per day for the same user to avoid being too repetitive
    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;

    return lastTriggeredDiff >= 1;
  },
  action: async (context) => {
    try {
      const peerId = context.request.peerId;
      const currentMessage = context.request.text;

      // Get message history for this peer
      const history = context.state?.history;

      if (!history || history.length < 10) {
        console.log(`Not enough history for peer ${peerId} to suggest answers`);
        return;
      }

      // Check if we need to index new messages
      // We'll index messages that haven't been indexed yet
      const lastIndexedCount = context.state?.vectorSearch?.lastIndexedCount || 0;
      const currentHistoryLength = history.length;

      if (currentHistoryLength > lastIndexedCount) {
        console.log(`Indexing new messages for peer ${peerId}...`);
        // Index only incoming messages (out === 0)
        await indexMessages(peerId, history);

        // Update state to track indexed count
        if (!context.state.vectorSearch) {
          context.state.vectorSearch = {};
        }
        context.state.vectorSearch.lastIndexedCount = currentHistoryLength;
      }

      // Get answer suggestions
      console.log(`Searching for similar messages to suggest answers for peer ${peerId}...`);
      const suggestions = await suggestAnswers(peerId, currentMessage, history, 3);

      if (suggestions.length > 0) {
        console.log(`Found ${suggestions.length} suggested answers for peer ${peerId}`);
        console.log('Suggestions:', suggestions.map((s, i) => `
  ${i + 1}. [Similarity: ${s.similarity.toFixed(4)}]
     Original: "${s.originalMessage}"
     Suggested: "${s.suggestedResponse}"`).join(''));

        // Store suggestions in state for potential use by other triggers
        // (This doesn't automatically send them - that's for future implementation)
        if (!context.state.vectorSearch) {
          context.state.vectorSearch = {};
        }
        context.state.vectorSearch.lastSuggestions = suggestions;
        context.state.vectorSearch.lastSuggestionsTime = DateTime.now();

        console.log(`Vector search suggestions are ready for peer ${peerId}. Top suggestion: "${suggestions[0].suggestedResponse}" (similarity: ${suggestions[0].similarity.toFixed(4)})`);
      } else {
        console.log(`No suitable answer suggestions found for peer ${peerId}`);
      }

    } catch (error) {
      console.error(`Error in SuggestAnswerTrigger for peer ${context.request.peerId}:`, error);
    }
  }
};

module.exports = {
  trigger
};
