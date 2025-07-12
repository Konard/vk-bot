const { sleep, second, ms } = require('../utils');

const communitiesIds = [
  76672098,
  65208427,
  100311974,
  122468609,
  146668183,
  153661315,
  214876603,
  223599067,
  224608811,
  224679085,
];

const postMessage = `Подпишись на группу Олевии Кибер: https://vk.com/club225128425 и послушай прикреплённую музыку её исполнения.
Если ты хочешь чтобы я подписался взаимно на твою группу - пиши в личку.`;

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const postsSearchRequest = `club225128425`;

async function sendInvitationPosts(context) {
  try {
    for (const communityId of communitiesIds) {
      const ownerId = '-' + communityId.toString();

      const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
      console.log(`Found ${previousPosts.count} previous posts.`);
      // console.log(previousPosts);
      await sleep((5 * second) / ms);

      for (const post of previousPosts.items) {
        // console.log(post.text.includes(postsSearchRequest))
        if (!post.can_delete || !post.text.includes(postsSearchRequest)) {
          continue;
        }
        try {
          const response = await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
          console.log(`Post ${post.id} is deleted.`);
          await sleep((5 * second) / ms);
        } catch (e) {
          if (e.code != 100) { // Ignore error: One of the parameters specified was missing or invalid: no post with this post_id
            throw e;
          }
        }
      }

      const response = await context.vk.api.wall.post({ owner_id: ownerId, message: postMessage, attachments: `${neuronalMiracleAudio},${daysOfMiraclesAudio}` })
      console.log('Post is sent to', communityId, 'community.');
      await sleep((5 * second) / ms);
    }
  } catch (error) {
    console.error(error);
  }
}

const trigger = {
  name: "InviteToGroup",
  action: async (context) => {
    return await sendInvitationPosts(context);
  }
};

module.exports = {
  trigger
};