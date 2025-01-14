const { sleep, getRandomElement } = require('../utils');

// [id, intervals]
// interval in cycles

const communitiesIntervals = [
  [64758790, 2],   // https://vk.com/club64758790
  [34985835, 3],   // https://vk.com/club34985835
  [24261502, 3],   // https://vk.com/club24261502
  [53294903, 4],   // https://vk.com/club53294903
  [33764742, 4],   // https://vk.com/club33764742
  [8337923, 5],    // https://vk.com/club8337923
  [94946045, 5],   // https://vk.com/club94946045
  [194360448, 5],  // https://vk.com/club194360448
  [39130136, 5],   // https://vk.com/club39130136
  [198580397, 10], // https://vk.com/club198580397
  [195285978, 10], // https://vk.com/club195285978
  [47350356, 10],  // https://vk.com/club47350356
  [61413825, 10],  // https://vk.com/club61413825
  [180442247, 20], // https://vk.com/club180442247
  [214787806, 20], // https://vk.com/club214787806
];

const currentCycle = 0;
const maxCycles = Math.max(...communitiesIntervals.map(([, interval]) => interval));

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
      if ((currentCycle % communityCycles) !== 0) {
        continue;
      }
      const communityId = communityInterval[0];
      const ownerId = '-' + communityId.toString();

      const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
      console.log(trigger.name, `Found ${previousPosts.count} previous posts.`);
      // console.log(previousPosts);
      await sleep(5000);

      await context.vk.api.wall.post({ owner_id: ownerId, message: postMessage, attachments: getRandomElement(audioAttachments) })
      console.log(trigger.name, 'Post is sent to', communityId, 'community.');
      await sleep(5000);

      for (const post of previousPosts.items) {
        // console.log(post.text.includes(postsSearchRequest))
        if (!post.can_delete || !post.text.includes(postsSearchRequest)) {
          continue;
        }
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

module.exports = {
  trigger
};
