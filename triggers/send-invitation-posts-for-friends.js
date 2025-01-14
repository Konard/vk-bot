const { sleep, getRandomElement } = require('../utils');

// [id, intervals]
// interval in cycles

const communitiesIntervals = [
  [64758790, 3],   // https://vk.com/club64758790
  [34985835, 5],   // https://vk.com/club34985835
  [24261502, 5],   // https://vk.com/club24261502
  [53294903, 7],   // https://vk.com/club53294903
  [33764742, 7],   // https://vk.com/club33764742
  [8337923, 11],    // https://vk.com/club8337923
  [94946045, 11],   // https://vk.com/club94946045
  [194360448, 11],  // https://vk.com/club194360448
  [39130136, 11],   // https://vk.com/club39130136
  [198580397, 13], // https://vk.com/club198580397
  [195285978, 13], // https://vk.com/club195285978
  [47350356, 13],  // https://vk.com/club47350356
  [61413825, 13],  // https://vk.com/club61413825
  [180442247, 17], // https://vk.com/club180442247
  [214787806, 17], // https://vk.com/club214787806
];

let currentCycle = 0;
const maxCycles = 3 * 5 * 7 * 11 * 13 * 17;

const postMessage = `Я программист, принимаю все заявки в друзья.
Срочно? Нужно взаимоное действие (например лайк, подписку и т.п.)? 
Пиши в личку.
Я в Telegram: https://t.me/link_konard - канал, https://t.me/drakonard - личка.
Если нужен доступ к GPT, попробуй нашего бота в Telegram: https://t.me/DeepGPTBot?start=1339837872.`;

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

const postsSearchRequest = `Я программист`;

async function sendInvitationPosts(context) {
  try {
    console.log(trigger.name, 'Current cycle:', currentCycle);
    for (const communityInterval of communitiesIntervals) {
      const communityCycles = communityInterval[1];
      if (currentCycle < communityCycles || currentCycle % communityCycles !== 0) {
        continue;
      }
      console.log(trigger.name, 'Sending post to', communityInterval[0], 'community (cycles frequency:', communityCycles, ')');
      const communityId = communityInterval[0];
      const ownerId = '-' + communityId.toString();

      const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
      const filteredPosts = previousPosts.items.filter(post => post.text.includes(postsSearchRequest) && post.can_delete);
      console.log(trigger.name, `Found ${filteredPosts.length} previous posts.`);
      // console.log(previousPosts);
      await sleep(5000);

      await context.vk.api.wall.post({ owner_id: ownerId, message: postMessage, attachments: getRandomElement(audioAttachments) })
      console.log(trigger.name, 'Post is sent to', communityId, 'community.');
      await sleep(5000);

      for (const post of filteredPosts) {
        try {
          await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
          console.log(trigger.name, `Post ${post.id} is deleted.`);
          await sleep(5000);
        } catch (e) {
          if (e.code === 104) { // APIError: Code №104 - Not found
            continue;
          }
          if (e.code === 100) { // APIError: Code №100 - One of the parameters specified was missing or invalid: no post with this post_id
            continue;
          }
          throw e;
        }
      }
    }
  } catch (error) {
    console.error(trigger.name, error);
  } finally {
    if (maxCycles === currentCycle) {
      currentCycle = 0;
    }
    currentCycle++;
  }
}

const trigger = {
  name: "SendInvitationPostsForFriends",
  action: sendInvitationPosts
};

console.log(trigger.name, 'Max cycles:', maxCycles);

module.exports = {
  trigger
};
