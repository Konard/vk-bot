const { VK } = require('vk-io');
const { getToken } = require('../utils');

async function getChatMembers() {
  const token = getToken();
  const vk = new VK({ token });

  try {
    // Example chat ID - this would be replaced with actual chat ID
    const chatId = 2000000001; // Example: VK chat IDs typically start with 2000000000

    console.log(`Getting conversation info for chat ${chatId}...`);

    // Get conversation info
    const conversation = await vk.api.messages.getConversationsById({
      peer_ids: [chatId]
    });

    console.log('Conversation info:', JSON.stringify(conversation, null, 2));

    // Get chat members using messages.getConversationMembers
    console.log(`Getting members for chat ${chatId}...`);
    const members = await vk.api.messages.getConversationMembers({
      peer_id: chatId
    });

    console.log('Chat members:', JSON.stringify(members, null, 2));

    // Extract member IDs and basic info
    const memberIds = members.items.map(member => member.member_id);
    console.log('Member IDs:', memberIds);

    return { conversation: conversation.items[0], members: members.items, memberIds };
  } catch (error) {
    console.error('Error getting chat members:', error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  getChatMembers()
    .then(result => {
      console.log('Successfully got chat members:', result.memberIds.length, 'members');
    })
    .catch(error => {
      console.error('Failed to get chat members:', error);
    });
}

module.exports = { getChatMembers };