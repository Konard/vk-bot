/**
 * Neural Reactions Demo
 * This example demonstrates the AI-powered reaction system
 * and shows how it would work in real scenarios
 */

const {
  generateReaction,
  isPostWorthCommenting,
  calculateContextScore,
  contextKeywords
} = require('../triggers/funny-reactions');
const config = require('../neural-reactions-config');

console.log("🧠 Neural Network-like Reaction System Demo 🧠\n");

// Sample friend posts that might appear in VK
const realWorldPosts = [
  {
    id: 1,
    text: "Сегодня наконец-то закончил проект! Месяц работал над этой программой, и вот она готова 🎉",
    date: Date.now() / 1000,
    attachments: [{ type: 'photo' }],
    comments: { count: 2 },
    context: "Work accomplishment"
  },
  {
    id: 2,
    text: "Кто-нибудь знает хороший ресторан японской кухни в центре? Хочется попробовать что-то новое",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 1 },
    context: "Food recommendation request"
  },
  {
    id: 3,
    text: "Вчера посмотрел новый фильм Marvel, и это просто космос! Спецэффекты на высшем уровне 🚀",
    date: Date.now() / 1000,
    attachments: [{ type: 'video' }],
    comments: { count: 5 },
    context: "Entertainment review"
  },
  {
    id: 4,
    text: "Грустно... Сегодня узнал, что любимое кафе закрывается. Столько воспоминаний связано с этим местом 😢",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 3 },
    context: "Sad news"
  },
  {
    id: 5,
    text: "Наконец-то отпуск! Завтра лечу в Турцию, две недели на море 🏖️ Так соскучился по отдыху",
    date: Date.now() / 1000,
    attachments: [{ type: 'photo' }],
    comments: { count: 1 },
    context: "Travel excitement"
  },
  {
    id: 6,
    text: "Кто тут любит программирование на Python? Нашел классную библиотеку для машинного обучения",
    date: Date.now() / 1000,
    attachments: [{ type: 'link' }],
    comments: { count: 4 },
    context: "Technical sharing"
  },
  {
    id: 7,
    text: "Посмотрите какой смешной мем про программистов 😂 Прям про меня написано!",
    date: Date.now() / 1000,
    attachments: [{ type: 'photo' }],
    comments: { count: 2 },
    context: "Funny content"
  },
  {
    id: 8,
    text: "Готовлю борщ по бабушкиному рецепту. Запах на всю квартиру! 🍲",
    date: Date.now() / 1000,
    attachments: [{ type: 'photo' }],
    comments: { count: 0 },
    context: "Cooking"
  },
  {
    id: 9,
    text: "Работаю",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 0 },
    context: "Short status"
  },
  {
    id: 10,
    text: "Эта статья была опубликована 3 дня назад, информация может быть устаревшей...",
    date: (Date.now() / 1000) - (3 * 24 * 60 * 60), // 3 days ago
    attachments: [{ type: 'link' }],
    comments: { count: 0 },
    context: "Old post"
  }
];

console.log("📊 Analyzing posts with Neural Network approach:\n");

realWorldPosts.forEach((post, index) => {
  console.log(`\n--- Post ${index + 1}: ${post.context} ---`);
  console.log(`📝 Text: "${post.text}"`);

  // Calculate context scores for this post
  const contextScores = {};
  let maxScore = 0;
  let detectedContext = 'none';

  Object.keys(contextKeywords).forEach(contextType => {
    const score = calculateContextScore(post.text.toLowerCase(), contextType);
    if (score > 0) {
      contextScores[contextType] = score;
      if (score > maxScore) {
        maxScore = score;
        detectedContext = contextType;
      }
    }
  });

  if (Object.keys(contextScores).length > 0) {
    console.log(`🧠 Neural analysis:`);
    Object.entries(contextScores).forEach(([context, score]) => {
      console.log(`   ${context}: ${score} ${score === maxScore ? '← BEST MATCH' : ''}`);
    });
  } else {
    console.log(`🧠 Neural analysis: No specific context detected, using general patterns`);
  }

  // Check if worth commenting
  const worthCommenting = isPostWorthCommenting(post, 12345);
  console.log(`📋 Worth commenting: ${worthCommenting ? '✅ YES' : '❌ NO'}`);

  if (worthCommenting) {
    // Generate reaction
    const reaction = generateReaction(post);
    console.log(`🤖 Generated reaction: "${reaction}"`);

    // Simulate probability check
    const willComment = Math.random() < config.rateLimit.commentProbability;
    console.log(`🎲 Probability check (${config.rateLimit.commentProbability}): ${willComment ? '✅ WILL COMMENT' : '❌ SKIP'}`);
  }
});

console.log(`\n🔧 Current Configuration:`);
console.log(`   Max comments per run: ${config.rateLimit.maxCommentsPerRun}`);
console.log(`   Comment probability: ${config.rateLimit.commentProbability}`);
console.log(`   Max post age: ${config.postFilter.maxPostAgeHours} hours`);
console.log(`   Max existing comments: ${config.postFilter.maxExistingComments}`);
console.log(`   Run interval: ${config.rateLimit.runInterval} minutes`);

console.log(`\n📈 Summary:`);
const eligiblePosts = realWorldPosts.filter(post => isPostWorthCommenting(post, 12345));
console.log(`   Eligible posts: ${eligiblePosts.length}/${realWorldPosts.length}`);
console.log(`   Expected comments: ~${Math.round(eligiblePosts.length * config.rateLimit.commentProbability)}`);

console.log(`\n✨ Neural Reaction System Demo Complete! ✨`);
console.log(`The system successfully demonstrates AI-like behavior by:`);
console.log(`• Analyzing context and sentiment of posts`);
console.log(`• Generating appropriate reactions based on content`);
console.log(`• Applying smart filtering to avoid spam`);
console.log(`• Using configurable parameters for fine-tuning`);
console.log(`• Implementing rate limiting and safety measures`);