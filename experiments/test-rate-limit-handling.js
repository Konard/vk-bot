const { sleep, priorityFriendIds, second, minute, ms } = require('../utils');

// Mock VK API that simulates rate limiting
class MockVkApi {
  constructor() {
    this.callCount = 0;
    this.rateLimitAfter = 2; // Trigger rate limit after 2 calls
    this.friends = {
      add: this.mockFriendsAdd.bind(this)
    };
  }

  async mockFriendsAdd({ user_id, text }) {
    this.callCount++;

    console.log(`Mock API call ${this.callCount} for user ${user_id}`);

    // Simulate rate limit error after certain number of calls
    if (this.callCount >= this.rateLimitAfter && this.callCount <= this.rateLimitAfter + 2) {
      const error = new Error('Rate limit reached');
      error.code = 29;
      throw error;
    }

    // Simulate success
    await sleep(100); // Simulate API delay
    return { success: 1 };
  }
}

// Mock context with fake friends cache
async function getAllFriends() {
  return [
    { id: 138919441 }, // This friend already exists
  ];
}

async function loadAllFriends() {
  console.log('Friends cache reloaded');
}

// Test the logic extracted from the AcceptFriendRequests trigger
async function testPriorityFriendsRateLimit() {
  console.log('=== Testing Priority Friends Rate Limit Handling ===');

  const vk = { api: new MockVkApi() };
  const allFriends = await getAllFriends();
  const maxFriends = 10000;
  let addedFriends = 0;
  const existingFriends = allFriends.length;

  // Test with first 3 priority friends
  const testFriendIds = priorityFriendIds.slice(0, 3);

  for (const friendId of testFriendIds) {
    if ((existingFriends + addedFriends) >= maxFriends) {
      console.log(`Maximum friends count (${maxFriends}) exceeded. Cannot add more friends.`);
      break;
    }
    if (allFriends.some(friend => friend.id === friendId)) {
      console.log(`Friend with id ${friendId} is already in friends.`);
      continue;
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        await vk.api.friends.add({ user_id: friendId, text: '' });
        addedFriends++;
        console.log(`Friend request is sent to priority friend with id ${friendId}.`);
        break; // Success, exit retry loop
      } catch (error) {
        if (error.code === 177) { // APIError: Code №177 - Cannot add this user to friends as user not found
          console.log(`Could not send friend request to priority friend with id ${friendId}, because this friend is not found.`);
          break; // No retry needed for user not found
        } else if (error.code === 242) { // APIError: Code №242 - Too many friends: friends count exceeded
          console.log(`Could not send friend request to priority friend with id ${friendId}, because friends count (10000) exceeded.`);
          return; // Exit function completely
        } else if (error.code === 29) { // APIError: Code №29 - Rate limit reached
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`Rate limit reached for priority friend ${friendId}. Waiting 5 seconds (shortened for test) before retry ${retryCount}/${maxRetries}...`);
            await sleep(5000); // Use 5 seconds instead of 1 minute for testing
          } else {
            console.log(`Could not send friend request to priority friend with id ${friendId}, because rate limit reached after ${maxRetries} retries.`);
            break; // Exit retry loop after max retries
          }
        } else {
          console.error(`Could not send priority friend request to ${friendId}:`, error);
          break; // Exit retry loop for other errors
        }
      }
    }
    await sleep(1000); // Use 1 second instead of 10 seconds for testing
  }

  console.log(`Test completed. Added ${addedFriends} friends.`);
  console.log(`Total API calls made: ${vk.api.callCount}`);
}

// Run the test
testPriorityFriendsRateLimit().catch(console.error);