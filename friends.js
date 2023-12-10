const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const sourceCommunityId = 54530371;

const sex = {
  male: 2
};

const requestsLimit = 10000; // Maximum number of requests you expect
const requestsSegmentSize = 1000; // Number of requests fetched per segment

async function fetchRequests(segment, offset) {
  const req = await vk.api.friends.getRequests({ out: 1, count: segment, offset: offset });
  return req || [];
}

async function fetchAllRequests() {
  let requestsIds = [];
  for (let offset = 0; offset < requestsLimit; offset += requestsSegmentSize) {
    const segment = await fetchRequests(requestsSegmentSize, offset);
    requestsIds = requestsIds.concat(segment.items);
    if (segment.items.length < requestsSegmentSize) {
      // Early exit if we fetched less requests than requested: end of data.
      break;
    }
  }
  return requestsIds;
}

async function getOnlineFollowers(groupId, requestsIds) {
  let response = await vk.api.groups.getMembers({ group_id: groupId, sort: "id_desc", fields: ["online", "can_send_friend_request", "can_write_private_message", "can_see_all_posts", "is_friend", "sex", "has_photo", "language", "city"] });

  console.log('response.items.length', response.items.length);

  let onlineFollowers = [], friendIds = [], requestIds = [];

  for (let follower of response.items) {
    if (!follower.online) {
      continue;
    }
    if (follower.sex != sex.male) {
      continue;
    }
    if (follower.is_friend) {
      continue;
    }
    if (!follower.has_photo) {
      continue;
    }
    if (!follower.can_see_all_posts) {
      continue;
    }
    if (!follower.can_write_private_message) {
      continue;
    }
    if (!follower.can_send_friend_request) {
      continue;
    }
    if (follower.is_closed) {
      continue;
    }
    if (!follower.can_access_closed) {
      continue;
    }

    console.log('follower', follower);

    if (!requestsIds.includes(follower.id)) {
      onlineFollowers.push(follower.id);
    }
  }

  return onlineFollowers;
}

async function sendFriendRequest(userId) {
  return vk.api.friends.add({ user_id: userId });
}

async function main() {
  const requestsIds = await fetchAllRequests();
  let onlineFollowersIds = await getOnlineFollowers(sourceCommunityId, requestsIds);

  if (onlineFollowersIds.length <= 0) {
    console.log('No followers to add as friends found.');
    return;
  }

  const messagesHandlerInterval = setInterval(() => {
    const followerId = onlineFollowersIds.shift(); // dequeue follower
    if (!followerId) {
      return;
    }
    console.log(`Friend request will be sent to: ${followerId}`);
    sendFriendRequest(followerId)
      .then(response => console.log(`Friend request sent to: ${followerId}`))
      .catch(err => console.log(err));
  }, 5000);
}

main();