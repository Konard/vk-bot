const { getCache, loadMessages } = require('../messages-cache');
const { sleep, second, ms } = require('../utils');

const maxMessages = 5000; // Reduced from 15M to be conservative

const trigger = {
  name: "ClearHistoryTrigger",
  condition: () => true,
  action: async (context) => {
    console.log('ClearHistoryTrigger: Starting auto-clear check...');

    // Get active conversations automatically
    let conversations = [];
    try {
      const conversationsResponse = await context.vk.api.messages.getConversations({
        count: 200, // VK API allows max 200 conversations per request
        offset: 0,
        filter: 'all'
      });
      conversations = conversationsResponse.items;
      console.log(`ClearHistoryTrigger: Found ${conversations.length} conversations to check`);
    } catch (error) {
      console.error('ClearHistoryTrigger: Error getting conversations:', error);
      return;
    }

    for (const conversationItem of conversations) {
      const chatId = conversationItem.conversation.peer.id;
      try {
        const response = await context.vk.api.messages.getHistory({
          peer_id: chatId,
          count: 0
        });
        const messageCount = response.count;
        if (messageCount <= maxMessages) {
          continue;
        }

        console.log(`ClearHistoryTrigger: Chat ${chatId} has ${messageCount} messages, clearing...`);

        // Try to delete the entire conversation in one call
        let conversationDeleted = false;
        try {
          // Try old method first
          await context.vk.api.messages.deleteDialog({ peer_id: chatId });
          console.log(`ClearHistoryTrigger: Deleted dialog for chat ${chatId} using deleteDialog`);
          conversationDeleted = true;
        } catch (error) {
          console.log(`ClearHistoryTrigger: Failed deleteDialog for chat ${chatId}, trying deleteConversation:`, error);
          try {
            await context.vk.api.messages.deleteConversation({ peer_id: chatId });
            console.log(`ClearHistoryTrigger: Deleted conversation for chat ${chatId} using deleteConversation`);
            conversationDeleted = true;
          } catch (error2) {
            console.log(`ClearHistoryTrigger: Failed deleteConversation for chat ${chatId}, falling back to deleting messages:`, error2);
          }
        }

        if (!conversationDeleted) {
          // Load all messages
          const messages = await loadMessages({ context, friendId: chatId, updateCache: false });

          // Get message IDs
          const ids = messages.map(m => m.conversation_message_id || m.id);

          // Delete in batches of 100
          const batchSize = 100;
          for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            try {
              const deleteParams = {
                peer_id: chatId,
                [chatId > 0 ? 'message_ids' : 'conversation_message_ids']: batch.join(','),
                delete_for_all: 0  // Delete only for the current user (bot)
              };
              await context.vk.api.messages.delete(deleteParams);
              console.log(`ClearHistoryTrigger: Deleted ${batch.length} messages from chat ${chatId} (for bot only)`);
              await sleep((2 * second) / ms); // Rate limit
            } catch (deleteError) {
              console.error(`ClearHistoryTrigger: Error deleting batch for chat ${chatId}:`, deleteError);
            }
          }
        }

        // Clear the messages cache
        const cache = await getCache();
        await cache.del(chatId);
        console.log(`ClearHistoryTrigger: Cleared messages cache for chat ${chatId}`);

        // Clear the local history in peers state
        if (context?.states?.[chatId]) {
          context.states[chatId].history = [];
          console.log(`ClearHistoryTrigger: Cleared local history for chat ${chatId}`);
        }
      } catch (error) {
        console.error(`ClearHistoryTrigger: Error clearing history for chat ${chatId}:`, error);
      }
    }

    console.log('ClearHistoryTrigger: Auto-clear check completed.');
  }
};

module.exports = {
  trigger,
  maxMessages
};