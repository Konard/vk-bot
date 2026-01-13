const {
  generateReaction,
  isPostWorthCommenting,
  calculateContextScore,
  contextKeywords
} = require('../triggers/funny-reactions');

describe('Neural Reactions System', () => {
  describe('Context Score Calculation', () => {
    test('should calculate correct score for work context', () => {
      const text = 'сегодня на работе писал код и проект готов';
      const score = calculateContextScore(text, 'work');
      expect(score).toBeGreaterThan(0);
    });

    test('should calculate higher score for multiple keywords', () => {
      const text1 = 'работа';
      const text2 = 'работа код проект программирование';
      const score1 = calculateContextScore(text1, 'work');
      const score2 = calculateContextScore(text2, 'work');
      expect(score2).toBeGreaterThan(score1);
    });

    test('should return zero for unrelated text', () => {
      const text = 'просто случайный текст без ключевых слов';
      const score = calculateContextScore(text, 'work');
      expect(score).toBe(0);
    });
  });

  describe('Reaction Generation', () => {
    test('should generate context-specific reaction for work posts', () => {
      const post = {
        text: 'закончил проект по программированию',
        attachments: []
      };
      const reaction = generateReaction(post);
      expect(contextKeywords.work.reactions).toContain(reaction);
    });

    test('should generate attachment-specific reaction', () => {
      const post = {
        text: 'посмотрите',
        attachments: [{ type: 'photo' }]
      };
      const reaction = generateReaction(post);
      // Should be either context-specific or photo-specific
      expect(typeof reaction).toBe('string');
      expect(reaction.length).toBeGreaterThan(0);
    });

    test('should always return a string reaction', () => {
      const post = {
        text: 'любой текст',
        attachments: []
      };
      const reaction = generateReaction(post);
      expect(typeof reaction).toBe('string');
      expect(reaction.length).toBeGreaterThan(0);
    });
  });

  describe('Post Filtering', () => {
    const basePost = {
      id: 1,
      text: 'нормальный пост с достаточным количеством текста',
      date: Date.now() / 1000,
      attachments: [],
      comments: { count: 2 }
    };

    test('should approve normal posts', () => {
      expect(isPostWorthCommenting(basePost, 12345)).toBe(true);
    });

    test('should reject old posts', () => {
      const oldPost = {
        ...basePost,
        date: (Date.now() / 1000) - (48 * 60 * 60) // 48 hours ago
      };
      expect(isPostWorthCommenting(oldPost, 12345)).toBe(false);
    });

    test('should reject posts with too many comments', () => {
      const popularPost = {
        ...basePost,
        comments: { count: 20 }
      };
      expect(isPostWorthCommenting(popularPost, 12345)).toBe(false);
    });

    test('should reject very short posts without attachments', () => {
      const shortPost = {
        ...basePost,
        text: 'hi'
      };
      expect(isPostWorthCommenting(shortPost, 12345)).toBe(false);
    });

    test('should approve short posts with attachments', () => {
      const shortPostWithPhoto = {
        ...basePost,
        text: 'hi',
        attachments: [{ type: 'photo' }]
      };
      expect(isPostWorthCommenting(shortPostWithPhoto, 12345)).toBe(true);
    });
  });

  describe('Context Keywords', () => {
    test('should have all required context categories', () => {
      expect(contextKeywords).toHaveProperty('positive');
      expect(contextKeywords).toHaveProperty('negative');
      expect(contextKeywords).toHaveProperty('work');
      expect(contextKeywords).toHaveProperty('food');
      expect(contextKeywords).toHaveProperty('travel');
    });

    test('should have keywords and reactions for each context', () => {
      Object.values(contextKeywords).forEach(context => {
        expect(context).toHaveProperty('keywords');
        expect(context).toHaveProperty('reactions');
        expect(Array.isArray(context.keywords)).toBe(true);
        expect(Array.isArray(context.reactions)).toBe(true);
        expect(context.keywords.length).toBeGreaterThan(0);
        expect(context.reactions.length).toBeGreaterThan(0);
      });
    });
  });
});