const { sleep, getRandomElement, second, minute } = require('../utils');
// const fs = require('fs');

const communities = [
  64758790,   // https://vk.com/club64758790
  34985835,   // https://vk.com/club34985835
  24261502,   // https://vk.com/club24261502
  53294903,   // https://vk.com/club53294903
  33764742,   // https://vk.com/club33764742
  8337923,    // https://vk.com/club8337923
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
А ещё у меня много друзей, которые тоже будут рады принять тебя в друзья.
Пиши в личку, буду рад обсудить любые предложения.
Я в Telegram: https://t.me/link_konard - канал, https://t.me/drakonard - личка.
Если нужен доступ к GPT: https://t.me/DeepGPTBot?start=1339837872 (наша разработка).`;

const restrictedPostMessage = `Я программист, принимаю все заявки в друзья.
А ещё у меня много друзей, которые тоже будут рады принять тебя в друзья.
Пиши в личку, буду рад обсудить любые предложения.`;

const neuronalMiracleAudio = 'audio-2001064727_125064727';
const daysOfMiraclesAudio = 'audio-2001281499_119281499';

const audioAttachments = [
  neuronalMiracleAudio,
  daysOfMiraclesAudio
];

const postsSearchRequest = `Я программист, принимаю все заявки в друзья.`;

const avatarImagePath = 'avatar.jpeg';

/**
 * Uploads an avatar image using vk-io uploader.
 * For community wall photos, pass the community id (a positive number) as groupId.
 * Returns the attachment string (e.g. "photo-123_456789").
 */
async function uploadAvatarPicture(context, communityId, imagePath) {
  // Check if the file exists
  // if (!fs.existsSync(imagePath)) {
  //   throw new Error(`Avatar file not found at path: ${imagePath}`);
  // }

  // const photo = await context.vk.upload.wallPhoto({
  //   source: {
  //     value: fs.createReadStream(imagePath),
  //     options: {
  //       filename: 'avatar.jpeg',
  //       contentType: 'image/jpeg'
  //     }
  //   },
  //   groupId: communityId
  // });

  // console.log('photo', photo);

  // return `photo${photo.ownerId}_${photo.id}_${photo.accessKey}`;

  return 'photo3972090_457245822_5f56ac9e1f0de697db'; // do not upload again
}

async function sendInvitationPosts(context) {
  try {
    for (const communityId of communities) {
      // For wall posts, VK expects a negative owner_id for communities.
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

      await sleep(trigger.name, 10 * second);

      if (topPostsHaveInvitation) {
        continue;
      }

      const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
      const postsToDelete = previousPosts.items.filter(post => post.text.includes(postsSearchRequest) && post.can_delete);
      console.log(trigger.name, `Found ${postsToDelete.length} previous posts to be deleted.`);
      await sleep(trigger.name, 5 * second);

      try {
        console.log(trigger.name, `Sending post to ${communityId} community.`);

        const message = restrictedCommunities.includes(communityId) ? restrictedPostMessage : postMessage;

        const avatarAttachment = await uploadAvatarPicture(context, communityId, avatarImagePath);
        let attachments = [avatarAttachment];
        if (!restrictedCommunities.includes(communityId)) {
          attachments.push(getRandomElement(audioAttachments));
        }

        // await context.vk.api.wall.post({ owner_id: ownerId, message, attachments: attachments.join(',') });
        await context.vk.api.wall.post({ owner_id: ownerId, message, attachments });
        console.log(trigger.name, 'Post is sent to', communityId, 'community.');
        await sleep(trigger.name, 5 * second);
      } catch (e) {
        if (e.code === 210) { // APIError: Code №210 - Access to wall's post denied
          console.warn(trigger.name, `Warning: Access to wall's post denied for community ${communityId}.
As this usually corresponds to the rate limit of VK API, the request should be repeated after a delay.`);
          await sleep(trigger.name, 1 * minute);
          continue;
        } else if (e.code === 14) { // APIError: Code №14 - Captcha needed
          console.warn(trigger.name, `Warning: Captcha needed to post to community ${communityId}.
As this usually corresponds to the rate limit of VK API, the request should be repeated after a delay.`);
          await sleep(trigger.name, 1 * minute);
          continue;
        } else if (e.code === 219) { // APIError: Code №219 - Advertisement post was recently added
          console.warn(trigger.name, `Warning: Advertisement post was recently added to community ${communityId}.
As this usually corresponds to the rate limit of VK API, the request should be repeated after a delay.`);
          await sleep(trigger.name, 1 * minute);
          continue;
        } else if (e.code === 10) { // APIError: Code №10 - Internal server error: Unknown error, try later
          console.warn(trigger.name, `Warning: Unknown error occurred while posting to community ${communityId}.
As we explicitly asked to try later by VK API, the request should be repeated after a delay.`);
          await sleep(trigger.name, 1 * minute);
        } else {
          throw e;
        }
      }

      for (const post of postsToDelete) {
        try {
          await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
          console.log(trigger.name, `Post ${post.id} is deleted.`);
          await sleep(trigger.name, 5 * second);
        } catch (e) {
          if (e.code === 104) { // APIError: Code №104 - Not found
            console.warn(trigger.name, `Post ${post.id} is not found. It may already be deleted.`);
            continue;
          }
          if (e.code === 100) { // APIError: Code №100 - One of the parameters specified was missing or invalid: no post with this post_id
            console.warn(trigger.name, `Post ${post.id} is not found. It may already be deleted.`);
            continue;
          }
          if (e.code === 210) {
            console.warn(trigger.name, `Access to wall's post denied for community ${communityId}.
As this usually corresponds to the rate limit, the request should be repeated after a delay.`);
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
