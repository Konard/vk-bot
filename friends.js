const { VK } = require('vk-io');
const { sleep, getToken, second, ms } = require('./utils');
const token = getToken();
const vk = new VK({ token });

const targetFriendsCount = Number(process.argv[2]) || 0;

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

function randomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

async function getOnlineFollowers(groupId, requestsIds) {
  const offset = randomInRange(0, 428000);
  let response = await vk.api.groups.getMembers({ group_id: groupId, sort: "id_desc", fields: ["online", "can_send_friend_request", "can_write_private_message", "can_see_all_posts", "is_friend", "sex", "has_photo", "language", "city"], offset, count: 1000 });

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

let messagesHandlerInterval;

async function main() {
  if (targetFriendsCount <= 0) {
    return;
  }

  const requestsIds = await fetchAllRequests();
  let onlineFollowersIds = [];

  while (onlineFollowersIds.length < targetFriendsCount) {
    onlineFollowersIds = [...onlineFollowersIds, ...await getOnlineFollowers(sourceCommunityId, requestsIds)];
    console.log('Current number of friends to invite: ', onlineFollowersIds.length);
    await sleep((3 * second) / ms);
  }

  if (onlineFollowersIds.length <= 0) {
    console.log('No followers to add as friends found.');
    return;
  } else {
    console.log(`${onlineFollowersIds.length} followers will be added as friends.`);
  }

  messagesHandlerInterval = setInterval(() => {
    const followerId = onlineFollowersIds.shift(); // dequeue follower
    if (!followerId) {
      clearInterval(messagesHandlerInterval);
      return;
    }
    sendFriendRequest(followerId)
      .then(response => console.log(`Friend request sent to: ${followerId}`))
      .catch(e => {
        if (e.code === 8) {
          console.log('Friend requests limit reached (40 per day or 10000 requests+friends).')
          clearInterval(messagesHandlerInterval);
          return;
        }
        console.log(e);
      });
    // try {
    //   await sendFriendRequest(followerId);
    // } catch (e) {
    //   console.log(e);
    // }
  }, (5 * second) / ms);
}

main();