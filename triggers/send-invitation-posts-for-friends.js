const { sleep, getRandomElement } = require('../utils');

const communities = [
  64758790,   // https://vk.com/club64758790
  34985835,   // https://vk.com/club34985835
  24261502,   // https://vk.com/club24261502
  53294903,   // https://vk.com/club53294903
  33764742,   // https://vk.com/club33764742
  8337923,    // https://vk.com/club8337923 (restore after 3rd of february 2025)
  94946045,   // https://vk.com/club94946045
  194360448,  // https://vk.com/club194360448
  39130136,   // https://vk.com/club39130136
  198580397,  // https://vk.com/club198580397
  195285978,  // https://vk.com/club195285978
  47350356,   // https://vk.com/club47350356
  61413825,   // https://vk.com/club61413825
  30345825,   // https://vk.com/club30345825
  180442247,  // https://vk.com/club180442247
  214787806,  // https://vk.com/club214787806
];

const restrictedCommunities = [
  64758790,   // https://vk.com/club64758790
  8337923,    // https://vk.com/club8337923
];

const postMessage = `Я программист, принимаю все заявки в друзья.
Срочно? Нужно взаимное действие (например лайк, подписку и т.п.)? 
Пиши в личку.
Я в Telegram: https://t.me/link_konard - канал, https://t.me/drakonard - личка.
Если нужен доступ к GPT, попробуй нашего бота в Telegram: https://t.me/DeepGPTBot?start=1339837872.`;

const restrictedPostMessage = `Я программист, принимаю все заявки в друзья.
Пиши в личку, буду рад обсудить любые предложения.`;

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

const postsSearchRequest = `Я программист, принимаю все заявки в друзья.`;

async function sendInvitationPosts(context) {
  try {
    for (const communityId of communities) {
      const ownerId = '-' + communityId.toString();

      const topPosts = await context.vk.api.wall.get({
        owner_id: ownerId,
        count: 10
      });
      // console.log(JSON.stringify(topPosts.items.map(post => {
      //   return {
      //     id: post.id,
      //     communityId: post.owner_id,
      //     text: post.text,
      //     date: new Date(post.date * 1000).toISOString()
      //   };
      // }), null, 2));

      const topPostsHaveInvitation = topPosts.items.some(post => post.text.includes(postsSearchRequest));

      console.log(trigger.name, `Loaded ${topPosts.items.length} posts from ${communityId} community. Our invitation post is ${topPostsHaveInvitation ? 'found' : 'not found'} in these posts.`);

      await sleep(trigger.name, 10000);

      if (topPostsHaveInvitation) {
        continue;
      }

      const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
      const postsToDelete = previousPosts.items.filter(post => post.text.includes(postsSearchRequest) && post.can_delete);
      console.log(trigger.name, `Found ${postsToDelete.length} previous posts to be deleted.`);
      await sleep(trigger.name, 5000);

      try {
        console.log(trigger.name, `Sending post to ${communityId} community.`);

        const message = restrictedCommunities.includes(communityId) ? restrictedPostMessage : postMessage;
        const attachments = restrictedCommunities.includes(communityId) ? [] : [getRandomElement(audioAttachments)];

        await context.vk.api.wall.post({ owner_id: ownerId, message, attachments });
        console.log(trigger.name, 'Post is sent to', communityId, 'community.');
        await sleep(trigger.name, 5000);
      } catch (e) {
        if (e.code === 210) { // APIError: Code №210 - Access to wall's post denied
          console.warn(trigger.name, `Access to wall's post denied for community ${communityId}.
As this usually corresponds to the rate limit, the request should be repeated after a increased delay.`);
          continue;
        } else {
          throw e;
        }
      }

      for (const post of postsToDelete) {
        try {
          await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
          console.log(trigger.name, `Post ${post.id} is deleted.`);
          await sleep(trigger.name, 5000);
        } catch (e) {
          if (e.code === 104) { // APIError: Code №104 - Not found
            console.warn(trigger.name, `Post ${post.id} is not found. It may be already deleted.`);
            continue;
          }
          if (e.code === 100) { // APIError: Code №100 - One of the parameters specified was missing or invalid: no post with this post_id
            console.warn(trigger.name, `Post ${post.id} is not found. It may be already deleted.`);
            continue;
          }
          if (e.code === 210) {
            console.warn(trigger.name, `Access to wall's post denied for community ${communityId}.
As this usually corresponds to the rate limit, the request should be repeated after a increased delay.`);
            break;
          }
          throw e;
        }
      }
    }
  } catch (error) {
    console.error(trigger.name, error);
  }
}

const trigger = {
  name: "SendInvitationPostsForFriends",
  action: sendInvitationPosts
};

module.exports = {
  trigger
};
