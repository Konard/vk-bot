const { sleep, getRandomElement, second, minute, ms, day, app } = require('../utils');

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

let disabledCommunities = [];

const disabledCommunitiesCleanupInterval = setInterval(() => {
  if (app.gracefullyFinished) {
    clearInterval(disabledCommunitiesCleanupInterval);
    return;
  }
  disabledCommunities = [];
}, (1 * day) / ms);

const restrictedCommunities = [
  64758790,   // https://vk.com/club64758790
  8337923,    // https://vk.com/club8337923
];

const commentMessages = [
  `Интересная тема! Я программист, буду рад обсудить технические аспекты.`,
  `Согласен с автором. У меня есть опыт в этой сфере, готов поделиться знаниями.`,
  `Полезная информация! Если есть вопросы по программированию - обращайтесь.`,
  `Отличный пост! Я в Telegram: https://t.me/drakonard - пишите, обсудим.`,
  `Хорошая мысль! Готов к сотрудничеству и новым знакомствам.`
];

const restrictedCommentMessages = [
  `Интересная тема! Буду рад обсудить.`,
  `Согласен с автором. Есть опыт в этой сфере.`,
  `Полезная информация! Готов поделиться знаниями.`,
  `Отличный пост! Готов к сотрудничеству.`,
  `Хорошая мысль! Буду рад новым знакомствам.`
];

const commentSearchKeywords = [
  'программист',
  'программирование',
  'разработка',
  'код',
  'IT',
  'технологии',
  'веб',
  'приложение',
  'сайт'
];

function disableCommunity(communityId) {
  if (!disabledCommunities.includes(communityId)) {
    disabledCommunities.push(communityId);
    console.warn(trigger.name, `Community ${communityId} is added to disabled communities list.`);
  }
}

async function hasAlreadyCommented(context, ownerId, postId) {
  try {
    const comments = await context.vk.api.wall.getComments({
      owner_id: ownerId,
      post_id: postId,
      count: 100
    });

    const currentUser = await context.vk.api.users.get();
    const myUserId = currentUser[0].id;
    return comments.items.some(comment => comment.from_id === myUserId);
  } catch (error) {
    console.warn(trigger.name, `Could not check existing comments for post ${postId}:`, error.message);
    return false;
  }
}

function shouldCommentOnPost(post) {
  const text = post.text.toLowerCase();
  return commentSearchKeywords.some(keyword => text.includes(keyword));
}

async function sendCommentsToCommunitiesAction(context) {
  try {
    for (const communityId of communities) {
      if (disabledCommunities.includes(communityId)) {
        console.log(trigger.name, `Community ${communityId} is disabled. Skipping.`);
        continue;
      }

      try {
        // For wall posts, VK expects a negative owner_id for communities.
        const ownerId = '-' + communityId.toString();

        const recentPosts = await context.vk.api.wall.get({
          owner_id: ownerId,
          count: 20
        });

        console.log(trigger.name, `Loaded ${recentPosts.items.length} posts from ${communityId} community.`);

        await sleep(trigger.name, (10 * second) / ms);

        let commentsCount = 0;
        for (const post of recentPosts.items) {
          // Skip posts that are too old (older than 7 days)
          const postDate = new Date(post.date * 1000);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          if (postDate < weekAgo) {
            continue;
          }

          // Check if post content is relevant for commenting
          if (!shouldCommentOnPost(post)) {
            continue;
          }

          // Check if we already commented on this post
          if (await hasAlreadyCommented(context, ownerId, post.id)) {
            console.log(trigger.name, `Already commented on post ${post.id}. Skipping.`);
            continue;
          }

          // Limit comments per community to avoid spam
          if (commentsCount >= 2) {
            console.log(trigger.name, `Reached comment limit for community ${communityId}.`);
            break;
          }

          const messages = restrictedCommunities.includes(communityId) ? restrictedCommentMessages : commentMessages;
          const commentMessage = getRandomElement(messages);

          console.log(trigger.name, `Adding comment to post ${post.id} in community ${communityId}.`);

          await context.vk.api.wall.createComment({
            owner_id: ownerId,
            post_id: post.id,
            message: commentMessage
          });

          console.log(trigger.name, `Comment added to post ${post.id} in community ${communityId}.`);
          commentsCount++;

          await sleep(trigger.name, (30 * second) / ms); // Longer delay between comments
        }

        await sleep(trigger.name, (10 * second) / ms);

      } catch (err) {
        if (err.code === 210) { // APIError: Code №210 - Access to wall's post denied
          console.warn(trigger.name, `Warning: Access to wall's post denied for community ${communityId}.`);
          disableCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 15) { // APIError: Code №15 - Access denied
          console.warn(trigger.name, `Warning: Access denied for community ${communityId}.`);
          disableCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 14) { // APIError: Code №14 - Captcha needed
          console.warn(trigger.name, `Warning: Captcha needed for community ${communityId}.`);
          await sleep(trigger.name, (2 * minute) / ms);
        } else if (err.code === 10) { // APIError: Code №10 - Internal server error
          console.warn(trigger.name, `Warning: Internal server error for community ${communityId}.`);
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
  name: "SendCommentsToCommunities",
  action: sendCommentsToCommunitiesAction
};

module.exports = {
  trigger
};