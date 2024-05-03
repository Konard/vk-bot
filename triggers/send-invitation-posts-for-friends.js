const { sleep, getRandomElement } = require('../utils');

const communitiesIds = [
  195285978,
  34985835,
  24261502,
  53294903,
  // 8337923,
  33764742,
  94946045,
  39130136,
  194360448,
  198580397,
  180442247,
  61413825,
  47350356,
  214787806,
];

const postMessage = `Я программист.
Принимаю все заявки в друзья.
Пиши в личку, если нужно принять твою заявку в друзья без очереди.
Предлагай взаимное действие (например лайк, подписку и т.п.) в личку.
Сделаю предложенное тобой взаимное действие после твоей подписки на https://vk.com/oleviia.`;

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

const postsSearchRequest = `Я программист.`;

async function sendInvitationPosts(context) {
  try {
    for (const communityId of communitiesIds) {
      const ownerId = '-' + communityId.toString();

      const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
      console.log(`Found ${previousPosts.count} previous posts.`);
      // console.log(previousPosts);
      await sleep(5000);

      for (const post of previousPosts.items) {
        // console.log(post.text.includes(postsSearchRequest))
        if (!post.can_delete || !post.text.includes(postsSearchRequest)) {
          continue;
        }
        try {
          const response = await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
          console.log(`Post ${post.id} is deleted.`);
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

      const response = await context.vk.api.wall.post({ owner_id: ownerId, message: postMessage, attachments: getRandomElement(audioAttachments) })
      console.log('Post is sent to', communityId, 'community.');
      await sleep(5000);
    }
  } catch (error) {
    console.error(error);
  }
}

const trigger = {
  name: "SendInvitationPostsForFriends",
  action: async (context) => {
    return await sendInvitationPosts(context);
  }
};

module.exports = {
  trigger
};
