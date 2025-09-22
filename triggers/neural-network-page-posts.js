const { sleep, getRandomElement, second, minute, ms, day, app } = require('../utils');
const fs = require('fs').promises;
const path = require('path');

// Load neural network communities from configuration
async function loadNeuralNetworkCommunities() {
  try {
    const configPath = path.join(__dirname, '..', 'neural-network-communities.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    return config.communities
      .filter(community => community.enabled && community.id)
      .map(community => community.id);
  } catch (error) {
    console.warn('Failed to load neural network communities configuration:', error.message);
    return [];
  }
}

let neuralNetworkCommunities = [];

let disabledNeuralCommunities = [];

const disabledCommunitiesCleanupInterval = setInterval(() => {
  if (app.gracefullyFinished) {
    clearInterval(disabledCommunitiesCleanupInterval);
    return;
  }
  disabledNeuralCommunities = [];
}, (1 * day) / ms);

// Neural network and AI-focused post content
const neuralNetworkPostMessages = [
  `🧠 Привет! Я программист, работающий с нейронными сетями и языковыми моделями.
Всегда готов обсудить AI, machine learning, и делиться опытом в этой области.
Принимаю все заявки в друзья от единомышленников!

🤖 Для доступа к GPT: https://t.me/DeepGPTBot?start=1339837872 (наша разработка)
📱 Telegram: https://t.me/link_konard - канал, https://t.me/drakonard - личка`,

  `🚀 Интересуешься нейронными сетями и языковыми моделями?
Я программист, специализирующийся на AI/ML. Давайте дружить и обмениваться знаниями!

💬 Пиши в личку - обсудим любые вопросы по машинному обучению
🔗 Полезные ссылки в моем профиле`,

  `🎯 Ищу единомышленников в области искусственного интеллекта!
Программист с опытом в neural networks. Принимаю заявки в друзья.

📚 Готов поделиться опытом и узнать что-то новое
💼 Открыт для интересных проектов и коллабораций`
];

const postsSearchRequest = `нейронн`; // Part of "нейронный" to find existing posts

const avatarImagePath = 'avatar.jpeg';

/**
 * Uploads an avatar image for neural network communities
 */
async function uploadAvatarPicture(context, communityId, imagePath) {
  // Using the same avatar approach as the main posting trigger
  return 'photo3972090_457245285_5f56ac9e1f0de697db';
}

function disableNeuralCommunity(communityId) {
  if (!disabledNeuralCommunities.includes(communityId)) {
    disabledNeuralCommunities.push(communityId);
    console.warn(trigger.name, `Neural network community ${communityId} is added to disabled communities list.`);
  }
}

async function sendNeuralNetworkPosts(context) {
  try {
    // Load communities from configuration each time to allow dynamic updates
    neuralNetworkCommunities = await loadNeuralNetworkCommunities();

    if (neuralNetworkCommunities.length === 0) {
      console.log(trigger.name, 'No neural network communities configured. Skipping.');
      return;
    }

    for (const communityId of neuralNetworkCommunities) {
      if (disabledNeuralCommunities.includes(communityId)) {
        console.log(trigger.name, `Neural network community ${communityId} is disabled. Skipping.`);
        continue;
      }

      try {
        // For wall posts, VK expects a negative owner_id for communities.
        const ownerId = '-' + communityId.toString();

        const topPosts = await context.vk.api.wall.get({
          owner_id: ownerId,
          count: 10
        });

        const topPostsHaveNeuralPost = topPosts.items.some(post =>
          post.text.toLowerCase().includes(postsSearchRequest.toLowerCase())
        );

        console.log(trigger.name, `Loaded ${topPosts.items.length} posts from neural network community ${communityId}. Our neural network post is ${topPostsHaveNeuralPost ? 'found' : 'not found'} in these posts.`);

        await sleep(trigger.name, (10 * second) / ms);

        if (topPostsHaveNeuralPost) {
          continue;
        }

        const previousPosts = await context.vk.api.wall.search({
          owner_id: ownerId,
          query: postsSearchRequest,
          count: 15
        });
        const postsToDelete = previousPosts.items.filter(post =>
          post.text.toLowerCase().includes(postsSearchRequest.toLowerCase()) && post.can_delete
        );

        console.log(trigger.name, `Found ${postsToDelete.length} previous neural network posts to be deleted.`);
        await sleep(trigger.name, (5 * second) / ms);
        console.log(trigger.name, `Sending neural network post to ${communityId} community.`);

        const message = getRandomElement(neuralNetworkPostMessages);
        const avatarAttachment = await uploadAvatarPicture(context, communityId, avatarImagePath);
        const attachments = [avatarAttachment];

        await context.vk.api.wall.post({ owner_id: ownerId, message, attachments });
        console.log(trigger.name, 'Neural network post is sent to', communityId, 'community.');
        await sleep(trigger.name, (5 * second) / ms);

        for (const post of postsToDelete) {
          try {
            await context.vk.api.wall.delete({ owner_id: ownerId, post_id: post.id });
            console.log(trigger.name, `Neural network post ${post.id} is deleted.`);
            await sleep(trigger.name, (5 * second) / ms);
          } catch (e) {
            if (e.code === 104 || e.code === 100) {
              console.warn(trigger.name, `Neural network post ${post.id} is not found. It may already be deleted.`);
              continue;
            }
            throw e;
          }
        }
      } catch (err) {
        if (err.code === 210) {
          console.warn(trigger.name, `Warning: Access to wall's post denied for neural network community ${communityId}.`);
          disableNeuralCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 219) {
          console.warn(trigger.name, `Warning: Advertisement post was recently added to neural network community ${communityId}.`);
          disableNeuralCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 15) {
          console.warn(trigger.name, `Warning: Access denied to post to neural network community ${communityId} wall because it was disabled.`);
          disableNeuralCommunity(communityId);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 14) {
          console.warn(trigger.name, `Warning: Captcha needed to post to neural network community ${communityId}.`);
          await sleep(trigger.name, (1 * minute) / ms);
        } else if (err.code === 10) {
          console.warn(trigger.name, `Warning: Unknown error occurred while posting to neural network community ${communityId}.`);
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
  name: "SendNeuralNetworkPagePosts",
  action: sendNeuralNetworkPosts
};

module.exports = {
  trigger,
  neuralNetworkCommunities, // Export for configuration
  neuralNetworkPostMessages  // Export for testing/customization
};