const { sleep, getToken, second, ms } = require('./utils');
const { VK } = require('vk-io');

const token = getToken();
const vk = new VK({ token });

const maximumSuggestionsToAccept = Number(process.argv[2]) || 0;

console.log('maximumSuggestionsToAccept', maximumSuggestionsToAccept);

async function deleteFriendRequests() {
  try {
    if (maximumSuggestionsToAccept <= 0) {
      return;
    }
    const count = 100;
    var currentUserId = (await vk.api.users.get())[0].id;
    console.log('currentUserId', currentUserId);
    const suggestions = (await vk.api.friends.getSuggestions({ filter: "mutual", fields: "online,can_post,can_see_all_posts,can_write_private_message,contacts,counters", count, offset: 0 })).items;
    await sleep((3 * second) / ms);
    console.log('suggestions: ', suggestions.length);
    const candidates = suggestions.filter(s => s.can_post && s.can_see_all_posts && s.can_write_private_message && s.can_access_closed);
    console.log('candidates: ', candidates.length);
    const candidatesWithMutualFriendsCount = [];
    for (const candidate of candidates) {
      var mutualFriendsCount = (await vk.api.friends.getMutual({ source_uid: currentUserId, target_uid: candidate.id })).length;
      await sleep((3 * second) / ms);
      candidatesWithMutualFriendsCount.push([candidate.id, mutualFriendsCount]);
    }
    candidatesWithMutualFriendsCount.sort((a, b) => b[1] - a[1]);
    console.log('candidatesWithMutualFriendsCount', candidatesWithMutualFriendsCount);
    let suggestionsAccepted = 0;
    for (const candidate of candidatesWithMutualFriendsCount) {
      if (suggestionsAccepted >= maximumSuggestionsToAccept) {
        break;
      }
      const candidateId = candidate[0];
      const candidateMutualFriends = candidate[1];
      (await vk.api.friends.add({ user_id: candidateId }));
      await sleep((3 * second) / ms);
      console.log('Friend request to', candidateId, 'sent.');
      suggestionsAccepted++;
    }
  } catch (error) {
    console.error(error);
  }
}

deleteFriendRequests();