const { sleep } = require('./utils');
const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

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
];

const postMessage = `Я программист.
Принимаю все заявки в друзья. Ждать потребуется не более 10 минут.

И если тебе нравится прикреплённая музыка, то рекомендую подписаться на группу https://vk.com/oleviia`;

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const postsSearchRequest = `Я программист.`;

async function sendInvitationPosts() {
  try {
    for (const communityId of communitiesIds) {
      const ownerId = '-' + communityId.toString();

      const previousPosts = await vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 10 });
      console.log(`Found ${previousPosts.count} previous posts.`);
      // console.log(previousPosts);
      await sleep(5000);

      for (const post of previousPosts.items) {
        // console.log(post.text.includes(postsSearchRequest))
        if (!post.can_delete || !post.text.includes(postsSearchRequest)) {
          continue;
        }
        try {
          const response = await vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
          console.log(`Post ${post.id} is deleted.`);
          await sleep(5000);
        } catch (e) {
          if (e.code != 100) { // Ignore error: One of the parameters specified was missing or invalid: no post with this post_id
            throw e;
          }
        }
      }

      const response = await vk.api.wall.post({ owner_id: ownerId, message: postMessage, attachments: `${neuronalMiracleAudio},${daysOfMiraclesAudio}` })
      console.log('Post is sent to', communityId, 'community.');
      await sleep(5000);
    }
  } catch (error) {
    console.error(error);
  }
}

sendInvitationPosts();