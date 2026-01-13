const { sleep, second, ms, getRandomElement } = require('../utils');
const { sendMessage } = require('../outgoing-messages');
const { commonGreetingStickersIds } = require('./greeting');

async function greetGroupMembers(context) {
  const { vk, request } = context;
  const chatId = request.peerId;

  try {
    console.log(`Getting members for group chat ${chatId}...`);

    // Get chat members
    const membersResponse = await vk.api.messages.getConversationMembers({
      peer_id: chatId
    });

    const members = membersResponse.items || [];
    const memberIds = members
      .map(member => member.member_id)
      .filter(id => id > 0); // Filter out negative IDs (groups/bots) and zero

    console.log(`Found ${memberIds.length} members in group chat ${chatId}`);

    if (memberIds.length === 0) {
      console.log('No valid members found to greet');
      return;
    }

    // Send greeting to each member individually
    let greetedCount = 0;
    for (const memberId of memberIds) {
      try {
        // Check if we can send message to this user
        const conversations = await vk.api.messages.getConversationsById({
          peer_ids: [memberId]
        });

        const conversation = conversations.items[0];
        if (!conversation || !conversation.can_write?.allowed) {
          console.log(`Cannot send message to user ${memberId}, skipping`);
          continue;
        }

        // Send greeting message with random sticker
        await sendMessage({
          vk,
          response: {
            user_id: memberId,
            sticker_id: getRandomElement(commonGreetingStickersIds)
          }
        });

        greetedCount++;
        console.log(`Sent greeting to member ${memberId} (${greetedCount}/${memberIds.length})`);

        // Add delay between messages to avoid rate limiting
        if (greetedCount < memberIds.length) {
          await sleep(`Greet delay:`, (2 * second) / ms);
        }

      } catch (error) {
        console.error(`Failed to send greeting to member ${memberId}:`, error);
      }
    }

    console.log(`Successfully greeted ${greetedCount} out of ${memberIds.length} group members`);

    // Send confirmation message to the group chat
    await sendMessage({
      vk,
      response: {
        peer_id: chatId,
        message: `Привет всем! 👋 Отправил приветствие ${greetedCount} участникам группы!`
      }
    });

  } catch (error) {
    console.error(`Error getting group chat members for ${chatId}:`, error);

    // Send error message to the group chat
    await sendMessage({
      vk,
      response: {
        peer_id: chatId,
        message: 'Извините, не удалось получить список участников группы 😔'
      }
    });
  }
}

const trigger = {
  name: "GreetGroupMembers",
  condition: (context) => {
    // Only trigger for group chats (peer ID >= 2000000000)
    const isGroupChat = context.request.peerId >= 2000000000;

    // Check if message contains greeting command
    const text = context.request.text?.toLowerCase() || '';
    const isGreetCommand = text.includes('привет всем') ||
                          text.includes('поздоровайся со всеми') ||
                          text.includes('скажи привет всем') ||
                          text.includes('hi everyone') ||
                          text.includes('greet everyone');

    return isGroupChat && isGreetCommand && !context.request.isOutbox;
  },
  action: async (context) => {
    return await greetGroupMembers(context);
  }
};

module.exports = {
  trigger,
  greetGroupMembers
};