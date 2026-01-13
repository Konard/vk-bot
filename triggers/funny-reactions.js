const { sleep, getRandomElement, second, minute, ms, hour, day } = require('../utils');
const { DateTime } = require('luxon');
const config = require('../neural-reactions-config');

// Simple reaction templates for different post types
const reactionTemplates = {
  photo: [
    "Красивое фото! 📸",
    "Отличный снимок! 👌",
    "Классное фото! 😊",
    "Хорошая картинка! 👍",
    "Интересно! 🤔"
  ],
  text: [
    "Интересно написано! 🤓",
    "Согласен! 👍",
    "Хорошая мысль! 💭",
    "Круто! 😎",
    "Поддерживаю! ✊"
  ],
  video: [
    "Классное видео! 🎬",
    "Интересно посмотреть! 👀",
    "Хорошее видео! 📹",
    "Отличный контент! 🔥",
    "Занятно! 😄"
  ],
  link: [
    "Интересная ссылка! 🔗",
    "Спасибо за ссылку! 👍",
    "Полезно! 📚",
    "Хорошая находка! 🔍",
    "Занимательно! 🤓"
  ],
  audio: [
    "Хорошая музыка! 🎵",
    "Классный трек! 🎶",
    "Отличная песня! 🎤",
    "Нравится! 👍",
    "Хорошее звучание! 🔊"
  ]
};

// Funny reactions for special cases
const funnyReactions = [
  "Это же классика! 😂",
  "Ну ты даешь! 🤪",
  "Вот это поворот! 😱",
  "Неожиданно! 🤯",
  "Интересненько... 🧐",
  "А я и не знал! 😮",
  "Вот это да! 😲",
  "Прикольно! 😁",
  "Забавно! 🙃",
  "Оригинально! 🎭"
];

// Keywords that might trigger funny reactions
const funnyKeywords = [
  'смешно', 'прикол', 'юмор', 'шутка', 'ржач', 'лол', 'хаха', 'ахах',
  'мем', 'анекдот', 'весело', 'забавно', 'комедия', 'ирония'
];

// Context-aware keyword scoring system (neural network-like approach)
const contextKeywords = {
  positive: {
    keywords: ['отлично', 'супер', 'круто', 'классно', 'прекрасно', 'замечательно', 'здорово', 'хорошо', 'радость', 'счастье'],
    reactions: ['Радуюсь за тебя! 😊', 'Отлично! 🎉', 'Супер! 👍', 'Класс! 🔥']
  },
  negative: {
    keywords: ['плохо', 'грустно', 'печально', 'ужасно', 'проблема', 'беда', 'тяжело', 'сложно'],
    reactions: ['Держись! 💪', 'Все будет хорошо! 🙏', 'Не сдавайся! ✊', 'Поддерживаю! 🤗']
  },
  work: {
    keywords: ['работа', 'офис', 'проект', 'программирование', 'код', 'разработка', 'баг', 'релиз'],
    reactions: ['Продуктивно! 💻', 'Хорошая работа! 👨‍💻', 'Успехов в проекте! 🚀', 'Код — это искусство! 🎨']
  },
  food: {
    keywords: ['еда', 'вкусно', 'готовлю', 'ресторан', 'кафе', 'обед', 'ужин', 'завтрак'],
    reactions: ['Вкусно выглядит! 😋', 'Приятного аппетита! 🍽️', 'Ням-ням! 🤤', 'Поделись рецептом! 👨‍🍳']
  },
  travel: {
    keywords: ['путешествие', 'отпуск', 'море', 'отдых', 'поездка', 'страна', 'город'],
    reactions: ['Отличного отдыха! ✈️', 'Красивое место! 🌍', 'Хорошего путешествия! 🧳', 'Завидую! 😎']
  }
};

let lastProcessedPosts = new Map(); // Store last processed post IDs per friend
let friendsPostsCache = new Map(); // Cache friends' posts to avoid duplicates

/**
 * Neural network-like scoring system for reaction generation
 */
function calculateContextScore(text, contextType) {
  const keywords = contextKeywords[contextType].keywords;
  let score = 0;

  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 1;
    }
  });

  // Add bonus for multiple matches (context reinforcement)
  if (score > 1) {
    score *= config.neuralWeights.multipleKeywordBonus;
  }

  return score;
}

/**
 * Get reaction based on post content using AI-like classification
 */
function generateReaction(post) {
  const text = post.text?.toLowerCase() || '';
  const attachments = post.attachments || [];

  // Neural network-like context analysis
  const contextScores = {};
  let maxScore = 0;
  let bestContext = null;

  // Calculate scores for each context
  Object.keys(contextKeywords).forEach(contextType => {
    const score = calculateContextScore(text, contextType);
    contextScores[contextType] = score;

    if (score > maxScore) {
      maxScore = score;
      bestContext = contextType;
    }
  });

  // If we found a strong context match, use context-specific reaction
  if (maxScore >= config.neuralWeights.contextScoreThreshold) {
    return getRandomElement(contextKeywords[bestContext].reactions);
  }

  // Check for funny keywords (high priority)
  const hasFunnyKeywords = funnyKeywords.some(keyword => text.includes(keyword));
  if (hasFunnyKeywords) {
    return getRandomElement(funnyReactions);
  }

  // Determine reaction based on attachments (medium priority)
  if (attachments.length > 0) {
    const attachmentType = attachments[0].type;
    if (reactionTemplates[attachmentType]) {
      return getRandomElement(reactionTemplates[attachmentType]);
    }
  }

  // Default to text reactions if no specific patterns found
  if (text.length > 10) {
    return getRandomElement(reactionTemplates.text);
  }

  // Random funny reaction for short posts
  return getRandomElement(funnyReactions);
}

/**
 * Check if post is worth commenting on
 */
function isPostWorthCommenting(post, friendId) {
  // Don't comment on old posts
  const postDate = new Date(post.date * 1000);
  const now = new Date();
  const hoursSincePost = (now - postDate) / (1000 * 60 * 60);

  if (hoursSincePost > config.postFilter.maxPostAgeHours) {
    if (config.debug.logFilteringDecisions) {
      console.log(`Post ${post.id} filtered: too old (${hoursSincePost.toFixed(1)} hours)`);
    }
    return false;
  }

  // Don't comment on posts that already have many comments
  if (post.comments && post.comments.count > config.postFilter.maxExistingComments) {
    if (config.debug.logFilteringDecisions) {
      console.log(`Post ${post.id} filtered: too many comments (${post.comments.count})`);
    }
    return false;
  }

  // Don't comment on posts that are too short
  const text = post.text || '';
  if (text.length < config.postFilter.minTextLength && (!post.attachments || post.attachments.length === 0)) {
    if (config.debug.logFilteringDecisions) {
      console.log(`Post ${post.id} filtered: too short and no attachments`);
    }
    return false;
  }

  // Check if we already processed this post
  const lastProcessed = lastProcessedPosts.get(friendId);
  if (lastProcessed && lastProcessed >= post.id) {
    if (config.debug.logFilteringDecisions) {
      console.log(`Post ${post.id} filtered: already processed`);
    }
    return false;
  }

  return true;
}

/**
 * Get recent posts from a friend's wall
 */
async function getFriendPosts(context, friendId) {
  try {
    const response = await context.vk.api.wall.get({
      owner_id: friendId,
      count: 5, // Get latest 5 posts
      filter: 'owner' // Only posts by the user, not reposts
    });

    return response.items || [];
  } catch (error) {
    // Handle access denied or other errors silently
    if (error.code === 15 || error.code === 30) {
      // Access denied or user's wall is private
      return [];
    }
    console.error(`Error getting posts for friend ${friendId}:`, error.message);
    return [];
  }
}

/**
 * Post a comment on a wall post
 */
async function postComment(context, ownerId, postId, message) {
  try {
    await context.vk.api.wall.createComment({
      owner_id: ownerId,
      post_id: postId,
      message: message
    });
    console.log(`Posted comment on ${ownerId}'s post ${postId}: "${message}"`);
    return true;
  } catch (error) {
    // Handle various errors
    if (error.code === 15) {
      console.log(`Access denied to comment on ${ownerId}'s post ${postId}`);
    } else if (error.code === 14) {
      console.log(`Captcha required for commenting on ${ownerId}'s post ${postId}`);
    } else {
      console.error(`Error posting comment on ${ownerId}'s post ${postId}:`, error.message);
    }
    return false;
  }
}

/**
 * Get list of friends
 */
async function getFriends(context) {
  try {
    const response = await context.vk.api.friends.get({
      fields: 'online,last_seen'
    });
    return response.items || [];
  } catch (error) {
    console.error('Error getting friends list:', error.message);
    return [];
  }
}

/**
 * Main function to process friends' posts and add reactions
 */
async function processFriendsPostsForReactions(context) {
  try {
    console.log('Starting to process friends posts for reactions...');

    const friends = await getFriends(context);
    console.log(`Found ${friends.length} friends to check for posts`);

    let commentsPosted = 0;
    const maxCommentsPerRun = config.rateLimit.maxCommentsPerRun;

    // Shuffle friends to randomize processing order
    const shuffledFriends = friends.sort(() => Math.random() - 0.5);

    for (const friend of shuffledFriends) {
      if (commentsPosted >= maxCommentsPerRun) {
        console.log('Reached maximum comments limit for this run');
        break;
      }

      try {
        const posts = await getFriendPosts(context, friend.id);

        for (const post of posts) {
          if (isPostWorthCommenting(post, friend.id)) {
            const reaction = generateReaction(post);

            // Add some randomness based on configuration
            if (Math.random() < config.rateLimit.commentProbability) {
              const success = await postComment(context, friend.id, post.id, reaction);

              if (success) {
                commentsPosted++;
                // Update last processed post ID for this friend
                lastProcessedPosts.set(friend.id, Math.max(lastProcessedPosts.get(friend.id) || 0, post.id));

                // Add delay between comments
                await sleep(trigger.name, (config.rateLimit.minDelayBetweenComments * second) / ms);

                if (commentsPosted >= maxCommentsPerRun) {
                  break;
                }
              }
            }
          }
        }

        // Small delay between friends
        await sleep(trigger.name, (config.rateLimit.minDelayBetweenFriends * second) / ms);

      } catch (error) {
        console.error(`Error processing posts for friend ${friend.id}:`, error.message);
        continue;
      }
    }

    console.log(`Finished processing. Posted ${commentsPosted} comments.`);

  } catch (error) {
    console.error('Error in processFriendsPostsForReactions:', error.message);
  }
}

const trigger = {
  name: "FunnyReactionsTrigger",
  action: processFriendsPostsForReactions
};

module.exports = {
  trigger,
  generateReaction,
  isPostWorthCommenting,
  calculateContextScore,
  reactionTemplates,
  funnyReactions,
  contextKeywords
};