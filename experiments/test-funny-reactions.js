const {
  generateReaction,
  isPostWorthCommenting,
  calculateContextScore,
  reactionTemplates,
  funnyReactions,
  contextKeywords
} = require('../triggers/funny-reactions');

// Test data - simulated VK posts
const testPosts = [
  {
    id: 1,
    text: "Сегодня отличная погода! Хорошо прогулялся в парке.",
    date: Date.now() / 1000, // Current time
    attachments: [{ type: 'photo' }],
    comments: { count: 2 }
  },
  {
    id: 2,
    text: "Посмотрите какой смешной мем я нашел! ржач просто 😂",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 0 }
  },
  {
    id: 3,
    text: "работаю",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 0 }
  },
  {
    id: 4,
    text: "Делюсь интересной ссылкой о новых технологиях в программировании",
    date: Date.now() / 1000,
    attachments: [{ type: 'link' }],
    comments: { count: 5 }
  },
  {
    id: 5,
    text: "Новая песня от любимого исполнителя!",
    date: Date.now() / 1000,
    attachments: [{ type: 'audio' }],
    comments: { count: 1 }
  },
  {
    id: 6,
    text: "Очень старый пост",
    date: (Date.now() / 1000) - (48 * 60 * 60), // 48 hours ago
    attachments: [{ type: 'video' }],
    comments: { count: 0 }
  },
  {
    id: 7,
    text: "Пост с большим количеством комментариев",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 15 }
  },
  {
    id: 8,
    text: "Сегодня на работе писал классный код! Проект продвигается отлично, скоро релиз!",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 2 }
  },
  {
    id: 9,
    text: "Готовлю вкусный ужин! Рецепт нашел в интернете, очень доволен результатом!",
    date: Date.now() / 1000,
    attachments: [{ type: 'photo' }],
    comments: { count: 1 }
  },
  {
    id: 10,
    text: "Планирую отпуск, хочу поехать к морю. Какие страны посоветуете?",
    date: Date.now() / 1000,
    attachments: [],
    comments: { count: 3 }
  }
];

console.log("=== Testing Funny Reactions System ===\n");

console.log("1. Testing reaction generation:");
testPosts.forEach((post, index) => {
  const reaction = generateReaction(post);
  console.log(`Post ${index + 1}: "${post.text}"`);
  console.log(`Generated reaction: "${reaction}"`);
  console.log(`Worth commenting: ${isPostWorthCommenting(post, 12345)}`);
  console.log("---");
});

console.log("\n2. Testing reaction templates:");
Object.keys(reactionTemplates).forEach(type => {
  console.log(`${type}: ${reactionTemplates[type].length} reactions available`);
  console.log(`Sample: "${reactionTemplates[type][0]}"`);
});

console.log(`\nFunny reactions: ${funnyReactions.length} reactions available`);
console.log(`Sample: "${funnyReactions[0]}"`);

console.log("\n3. Testing post filtering logic:");
const friendId = 12345;
const worthyPosts = testPosts.filter(post => isPostWorthCommenting(post, friendId));
console.log(`Out of ${testPosts.length} posts, ${worthyPosts.length} are worth commenting on`);

worthyPosts.forEach(post => {
  console.log(`- Post ${post.id}: "${post.text.substring(0, 50)}..."`);
});

console.log("\n4. Testing AI-like context scoring system:");
const contextTestPosts = [
  "Сегодня на работе писал классный код! Проект продвигается отлично, скоро релиз!",
  "Готовлю вкусный ужин! Рецепт нашел в интернете, очень доволен результатом!",
  "Планирую отпуск, хочу поехать к морю. Какие страны посоветуете?",
  "Грустно сегодня, на работе сложно, проблема за проблемой...",
  "Отлично провел день! Прекрасная погода, замечательное настроение!"
];

contextTestPosts.forEach((text, index) => {
  console.log(`\nPost: "${text}"`);

  Object.keys(contextKeywords).forEach(contextType => {
    const score = calculateContextScore(text.toLowerCase(), contextType);
    if (score > 0) {
      console.log(`  ${contextType} score: ${score}`);
    }
  });

  const reaction = generateReaction({ text, attachments: [] });
  console.log(`  Generated reaction: "${reaction}"`);
});

console.log("\n=== Neural Network-like Reaction System Test Completed ===");