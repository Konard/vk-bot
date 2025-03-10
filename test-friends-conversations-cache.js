const { getConversation, setConversation } = require('./friends-conversations-cache');

async function testGetConversation() {
  const friendId = "11";

  // Define a default factory function that returns a mock conversation
  const defaultFactory = async () => {
    return {
      id: friendId,
      messages: [
        { id: 1, text: 'Hello', date: Date.now() },
        { id: 2, text: 'How are you?', date: Date.now() }
      ]
    };
  };

  // Set a conversation for the friendId
  await setConversation(friendId, await defaultFactory());

  // Get the conversation using getConversation
  const conversation = await getConversation(friendId);

  console.log('Retrieved conversation:', conversation);
}

testGetConversation().catch(console.error);