const { executeTrigger, getToken } = require('../utils');

async function autoMuteOnInvite({ vk, request }) {
  try {
    // Check if this is a chat invite event
    if (!request.isEvent || request.eventType !== 'chat_invite_user') {
      return;
    }

    const peerId = request.peerId;
    const invitedMemberId = request.eventMemberId;

    // Get bot user ID to check if bot was invited
    const botInfo = await vk.api.users.get();
    const botUserId = botInfo[0].id;

    // Check if the bot was the one invited
    if (invitedMemberId !== botUserId) {
      return;
    }

    console.log(`Bot was invited to chat ${peerId}, attempting to mute conversation...`);

    // Try to mute the conversation using available VK API methods
    try {
      // Method 1: Try using messages.setConversationMember if available
      await vk.api.messages.setConversationMember({
        peer_id: peerId,
        member_id: botUserId,
        push_settings: 'disabled'
      });
      console.log(`Successfully muted conversation ${peerId} using setConversationMember`);
    } catch (error) {
      console.log('setConversationMember method failed, trying alternative approach:', error.message);

      try {
        // Method 2: Try using account.setPushSettings for the conversation
        await vk.api.account.setPushSettings({
          peer_id: peerId,
          sound: 0,
          disabled_until: -1 // Disable indefinitely
        });
        console.log(`Successfully muted conversation ${peerId} using setPushSettings`);
      } catch (error2) {
        console.log('setPushSettings method failed, trying setSilenceMode:', error2.message);

        try {
          // Method 3: Try using account.setSilenceMode for the specific peer
          await vk.api.account.setSilenceMode({
            peer_id: peerId,
            time: -1 // Mute indefinitely
          });
          console.log(`Successfully muted conversation ${peerId} using setSilenceMode`);
        } catch (error3) {
          console.error(`Failed to mute conversation ${peerId} with all methods:`, error3.message);
        }
      }
    }

  } catch (error) {
    console.error('Error in autoMuteOnInvite trigger:', error);
  }
}

const trigger = {
  name: "AutoMuteOnInvite",
  action: async (context) => {
    return await autoMuteOnInvite(context);
  }
};

module.exports = {
  trigger
};