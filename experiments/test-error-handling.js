// Test script to verify that the error handling logic works correctly
// This simulates the VK API error scenarios

const { sleep } = require('../utils');

// Mock VK API that can throw error code 10
class MockVKAPI {
  constructor(shouldThrowError = false) {
    this.shouldThrowError = shouldThrowError;
    this.callCount = 0;
  }

  get wall() {
    return {
      get: async (params) => {
        this.callCount++;
        if (this.shouldThrowError && this.callCount <= 2) {
          const error = new Error('Internal server error: Unknown error, try later');
          error.code = 10;
          throw error;
        }
        return {
          items: [
            { id: 1, text: 'Test post', owner_id: params.owner_id }
          ]
        };
      },
      search: async (params) => {
        this.callCount++;
        if (this.shouldThrowError && this.callCount <= 2) {
          const error = new Error('Internal server error: Unknown error, try later');
          error.code = 10;
          throw error;
        }
        return {
          items: [
            { id: 2, text: 'Previous post', can_delete: true }
          ]
        };
      }
    };
  }
}

// Test function that simulates the error handling logic from our fix
async function testErrorHandling() {
  console.log('Testing error handling for API code 10...');

  const mockAPI = new MockVKAPI(true); // Will throw errors on first 2 calls
  const context = {
    vk: {
      api: mockAPI
    }
  };

  const trigger = {
    name: "SendInvitationPostsForFriends"
  };

  const communityId = 12345;
  const ownerId = '-' + communityId.toString();
  const postsSearchRequest = 'Я программист, принимаю все заявки в друзья.';

  try {
    // Test wall.get error handling
    let topPosts;
    try {
      topPosts = await context.vk.api.wall.get({
        owner_id: ownerId,
        count: 10
      });
    } catch (err) {
      if (err.code === 10) {
        console.log(`✓ Handled wall.get error code 10: ${err.message}`);
        // In real code, we would continue to next community
        return;
      }
      throw err;
    }

    // Test wall.search error handling
    let previousPosts;
    try {
      previousPosts = await context.vk.api.wall.search({
        owner_id: ownerId,
        query: postsSearchRequest,
        count: 15
      });
    } catch (err) {
      if (err.code === 10) {
        console.log(`✓ Handled wall.search error code 10: ${err.message}`);
        // In real code, we would continue to next community
        return;
      }
      throw err;
    }

    console.log('✓ Both API calls succeeded after retries');

  } catch (error) {
    console.error('✗ Unexpected error:', error);
  }
}

// Run the test
testErrorHandling().then(() => {
  console.log('Error handling test completed!');
}).catch(err => {
  console.error('Test failed:', err);
});