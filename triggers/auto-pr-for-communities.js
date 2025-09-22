const { sleep, getRandomElement, second, minute, ms, day, app } = require('../utils');

// Community IDs from issue #62
const communities = [
  65208427,   // https://vk.com/club65208427
  100311974,  // https://vk.com/club100311974
  76672098,   // https://vk.com/club76672098
  223599067,  // https://vk.com/club223599067
  214876603,  // https://vk.com/club214876603
  224608811,  // https://vk.com/club224608811
  153661315,  // https://vk.com/club153661315
  146668183,  // https://vk.com/club146668183
  224679085,  // https://vk.com/club224679085
  122468609,  // https://vk.com/club122468609
];

let disabledCommunities = [];

const disabledCommunitiesCleanupInterval = setInterval(() => {
  if (app.gracefullyFinished) {
    clearInterval(disabledCommunitiesCleanupInterval);
    return;
  }
  disabledCommunities = [];
}, (1 * day) / ms);

const postMessage = `Я программист, принимаю все заявки в друзья.
А ещё у меня много друзей, которые тоже будут рады принять тебя в друзья.
Пиши в личку, буду рад обсудить любые предложения.
Я в Telegram: https://t.me/link_konard - канал, https://t.me/drakonard - личка.
Если нужен доступ к GPT: https://t.me/DeepGPTBot?start=1339837872 (наша разработка).`;

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
  // Reuse existing avatar attachment to avoid re-uploading
  return 'photo3972090_457245285_5f56ac9e1f0de697db'; // attempt to use avatar
}

function disableCommunity(communityId) {
  if (!disabledCommunities.includes(communityId)) {
    disabledCommunities.push(communityId);
    console.warn(trigger.name, `Community ${communityId} is added to disabled communities list.`);
  }
}

async function sendAutoPRPosts(context) {
  try {
    for (const communityId of communities) {
      if (disabledCommunities.includes(communityId)) {
        console.log(trigger.name, `Community ${communityId} is disabled. Skipping.`);
        continue;
      }

      try {
        // For wall posts, VK expects a negative owner_id for communities.
        const ownerId = '-' + communityId.toString();

        const topPosts = await context.vk.api.wall.get({
          owner_id: ownerId,
          count: 10
        });

        const topPostsHaveInvitation = topPosts.items.some(post => post.text.includes(postsSearchRequest));

        console.log(trigger.name, `Loaded ${topPosts.items.length} posts from ${communityId} community. Our PR post is ${topPostsHaveInvitation ? 'found' : 'not found'} in these posts.`);

        await sleep(trigger.name, (10 * second) / ms);

        if (topPostsHaveInvitation) {
          continue;
        }

        const previousPosts = await context.vk.api.wall.search({ owner_id: ownerId, query: postsSearchRequest, count: 15 });
        const postsToDelete = previousPosts.items.filter(post => post.text.includes(postsSearchRequest) && post.can_delete);
        console.log(trigger.name, `Found ${postsToDelete.length} previous posts to be deleted.`);
        await sleep(trigger.name, (5 * second) / ms);
        console.log(trigger.name, `Sending PR post to ${communityId} community.`);

        const avatarAttachment = await uploadAvatarPicture(context, communityId, avatarImagePath);
        const attachments = [avatarAttachment, getRandomElement(audioAttachments)];

        await context.vk.api.wall.post({ owner_id: ownerId, message: postMessage, attachments });
        console.log(trigger.name, 'PR post is sent to', communityId, 'community.');
        await sleep(trigger.name, (5 * second) / ms);

        for (const post of postsToDelete) {
          try {
            await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
            console.log(trigger.name, `Post ${post.id} is deleted.`);
            await sleep(trigger.name, (5 * second) / ms);
          } catch (e) {
            if (e.code === 104) { // APIError: Code №104 - Not found
              console.warn(trigger.name, `Post ${post.id} is not found. It may already be deleted.`);
              continue;
            }
            if (e.code === 100) { // APIError: Code №100 - One of the parameters specified was missing or invalid: no post with this post_id
              console.warn(trigger.name, `Post ${post.id} is not found. It may already be deleted.`);
              continue;
            }
            throw e;
          }
        }
      } catch (err) {
        if (err.code === 210) { // APIError: Code №210 - Access to wall's post denied
          console.warn(trigger.name, `Warning: Access to wall's post denied for community ${communityId}.
As this may correspond to the rate limit of VK API, any next request should be repeated after a delay.`);
          disableCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 219) { // APIError: Code №219 - Advertisement post was recently added
          console.warn(trigger.name, `Warning: Advertisement post was recently added to community ${communityId}.
As this may correspond to the rate limit of VK API, any next request should be repeated after a delay.`);
          disableCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 15) { // APIError: Code №15 - Access denied: wall is disabled
          console.warn(trigger.name, `Warning: Access denied to post to community ${communityId} wall because it was disabled by administrator.
It may be done for an unknown period of time, moving the community to disabled communities list.`);
          disableCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 14) { // APIError: Code №14 - Captcha needed
          console.warn(trigger.name, `Warning: Captcha needed to post to community ${communityId}.
As this usually corresponds to the rate limit of VK API, any next request should be repeated after a delay.`);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 10) { // APIError: Code №10 - Internal server error: Unknown error, try later
          console.warn(trigger.name, `Warning: Unknown error occurred while posting to community ${communityId}.
As we explicitly asked to try later by VK API, any next request should be repeated after a delay.`);
          await sleep(trigger.name, (1 * minute) / ms);
        } else {
          throw err;
        }
      }
    }
  } catch (error) {
    console.error(trigger.name, error);
  }
}

const trigger = {
  name: "AutoPRForCommunities",
  action: sendAutoPRPosts
};

module.exports = {
  trigger
};