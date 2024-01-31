const { sleep } = require('./utils');
const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const minimumMutualFriendsToAcceptSuggestion = Number(process.argv[2]) || 0;

console.log('minimumMutualFriendsToAcceptSuggestion', minimumMutualFriendsToAcceptSuggestion);

async function deleteFriendRequests() {
  try {
    if (minimumMutualFriendsToAcceptSuggestion <= 0) {
      return;
    }
    const count = 500;
    var currentUserId = (await vk.api.users.get())[0].id;
    console.log('currentUserId', currentUserId);
    const suggestions = (await vk.api.friends.getSuggestions({ filter: "mutual", fields: "online,can_post,can_see_all_posts,can_write_private_message,contacts,counters", count, offset: 0 })).items;
    await sleep(3000);
    console.log('suggestions: ', suggestions.length);
    const candidates = suggestions.filter(s => s.can_post && s.can_see_all_posts && s.can_write_private_message && s.can_access_closed);
    // console.log(candidates);
    console.log('candidates: ', candidates.length);
    const candidatesWithMutualFriendsCount = [];
    for (const candidate of candidates) {
      var mutualFriendsCount = (await vk.api.friends.getMutual({ source_uid: currentUserId, target_uid: candidate.id })).length;
      await sleep(3000);
      candidatesWithMutualFriendsCount.push([candidate.id, mutualFriendsCount]);
    }
    // console.log('candidatesWithMutualFriendsCount', candidatesWithMutualFriendsCount);

    candidatesWithMutualFriendsCount.sort((a, b) => b[1] - a[1]);

    console.log('candidatesWithMutualFriendsCount', candidatesWithMutualFriendsCount);

    // let acceptedSuggestions = 0;

    for (const candidate of candidatesWithMutualFriendsCount) {
      const candidateId = candidate[0];
      const candidateMutualFriends = candidate[1];
      (await vk.api.friends.add({ user_id: candidateId }));
      await sleep(3000);
      console.log('Friend request to', candidateId, 'sent.');
      // acceptedSuggestions++;
      if (candidateMutualFriends <= minimumMutualFriendsToAcceptSuggestion) {
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

deleteFriendRequests();