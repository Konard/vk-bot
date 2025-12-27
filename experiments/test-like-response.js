const { trigger } = require('../triggers/like-in-response-to-likes');

// Mock VK API to test the functionality
const mockVk = {
  api: {
    users: {
      get: async () => [{ id: 12345 }] // Bot's ID
    },
    likes: {
      add: async (params) => {
        console.log('Would like:', params);
        return { success: true };
      }
    }
  }
};

// Test different scenarios
async function testLikeResponse() {
  console.log('Testing like-in-response-to-likes functionality...\n');

  // Test 1: Someone likes a post
  console.log('Test 1: Someone likes a post');
  const postLikeContext = {
    vk: mockVk,
    likerId: 67890,
    objectId: 111,
    objectType: 'post',
    objectOwnerId: 222,
    postId: 333
  };
  await trigger.action(postLikeContext);
  console.log('✓ Post like test completed\n');

  // Test 2: Someone likes a comment
  console.log('Test 2: Someone likes a comment');
  const commentLikeContext = {
    vk: mockVk,
    likerId: 67890,
    objectId: 444,
    objectType: 'comment',
    objectOwnerId: 555,
    postId: 666
  };
  await trigger.action(commentLikeContext);
  console.log('✓ Comment like test completed\n');

  // Test 3: Bot likes something (should be ignored)
  console.log('Test 3: Bot likes something (should be ignored)');
  const botLikeContext = {
    vk: mockVk,
    likerId: 12345, // Bot's own ID
    objectId: 777,
    objectType: 'post',
    objectOwnerId: 888,
    postId: 999
  };
  await trigger.action(botLikeContext);
  console.log('✓ Bot self-like test completed\n');

  // Test 4: Unknown object type
  console.log('Test 4: Unknown object type');
  const unknownTypeContext = {
    vk: mockVk,
    likerId: 67890,
    objectId: 101,
    objectType: 'unknown_type',
    objectOwnerId: 202,
    postId: 303
  };
  await trigger.action(unknownTypeContext);
  console.log('✓ Unknown type test completed\n');

  console.log('All tests completed successfully!');
}

// Run the test
testLikeResponse().catch(console.error);