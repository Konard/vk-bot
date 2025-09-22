// Mock VK-IO to avoid dynamic import issues in tests
jest.mock('vk-io', () => ({
  VK: jest.fn()
}));

// Mock utils to avoid token file dependency
jest.mock('../utils', () => ({
  getToken: jest.fn(),
  sleep: jest.fn(),
  second: 1000,
  ms: 1,
  saveJsonSync: jest.fn(),
  readJsonSync: jest.fn()
}));

// Mock friends-cache
jest.mock('../friends-cache', () => ({
  getAllFriends: jest.fn()
}));

const {
  calculateFriendScore,
  analyzeEducation,
  analyzeOccupation,
  analyzeTextFields,
  containsKeywords,
  PROGRAMMING_KEYWORDS,
  TECH_UNIVERSITIES,
  TECH_FACULTIES,
  TECH_OCCUPATIONS
} = require('../useful-friends-metrics');

describe('useful-friends-metrics', () => {
  describe('containsKeywords', () => {
    it('should find programming keywords in text', () => {
      expect(containsKeywords('I love programming', PROGRAMMING_KEYWORDS)).toBe(true);
      expect(containsKeywords('JavaScript developer', PROGRAMMING_KEYWORDS)).toBe(true);
      expect(containsKeywords('I study computer science', PROGRAMMING_KEYWORDS)).toBe(true); // computer is in keywords
      expect(containsKeywords('I like music', PROGRAMMING_KEYWORDS)).toBe(false);
      expect(containsKeywords(null, PROGRAMMING_KEYWORDS)).toBe(false);
      expect(containsKeywords('', PROGRAMMING_KEYWORDS)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(containsKeywords('PROGRAMMING', PROGRAMMING_KEYWORDS)).toBe(true);
      expect(containsKeywords('Programming', PROGRAMMING_KEYWORDS)).toBe(true);
      expect(containsKeywords('programming', PROGRAMMING_KEYWORDS)).toBe(true);
    });
  });

  describe('analyzeEducation', () => {
    it('should score tech universities higher', () => {
      const universities = [
        { university_name: 'МГТУ им. Баумана', faculty_name: 'Информатика' }
      ];
      const result = analyzeEducation(universities, null);
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toContain('Tech faculty: Информатика');
    });

    it('should handle empty education data', () => {
      const result = analyzeEducation(null, null);
      expect(result.score).toBe(0);
      expect(result.reasons).toEqual([]);
    });

    it('should score tech faculties', () => {
      const universities = [
        { university_name: 'Some University', faculty_name: 'Computer Science' }
      ];
      const result = analyzeEducation(universities, null);
      expect(result.score).toBe(2);
      expect(result.reasons[0]).toContain('Tech faculty: Computer Science');
    });
  });

  describe('analyzeOccupation', () => {
    it('should score programming occupations highly', () => {
      const occupation = { name: 'Software Developer' };
      const result = analyzeOccupation(occupation);
      expect(result.score).toBe(4);
      expect(result.reasons[0]).toContain('Tech occupation: Software Developer');
    });

    it('should handle empty occupation', () => {
      expect(analyzeOccupation(null).score).toBe(0);
      expect(analyzeOccupation({}).score).toBe(0);
      expect(analyzeOccupation({ name: null }).score).toBe(0);
    });

    it('should not score non-tech occupations', () => {
      const occupation = { name: 'Teacher' };
      const result = analyzeOccupation(occupation);
      expect(result.score).toBe(0);
      expect(result.reasons).toEqual([]);
    });
  });

  describe('analyzeTextFields', () => {
    it('should score programming interests', () => {
      const user = {
        interests: 'Programming, JavaScript, React',
        activities: 'Coding, open source projects',
        about: 'I am a web developer'
      };
      const result = analyzeTextFields(user);
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should handle empty text fields', () => {
      const user = {};
      const result = analyzeTextFields(user);
      expect(result.score).toBe(0);
      expect(result.reasons).toEqual([]);
    });

    it('should weight interests and activities higher than about', () => {
      const userWithInterests = { interests: 'programming' };
      const userWithAbout = { about: 'programming' };

      const interestsResult = analyzeTextFields(userWithInterests);
      const aboutResult = analyzeTextFields(userWithAbout);

      expect(interestsResult.score).toBeGreaterThan(aboutResult.score);
    });
  });

  describe('calculateFriendScore', () => {
    it('should calculate total score correctly', () => {
      const friend = {
        universities: [{ university_name: 'MIT', faculty_name: 'Computer Science' }],
        occupation: { name: 'Software Engineer' },
        interests: 'Programming, JavaScript',
        activities: 'Coding',
        about: 'Web developer'
      };

      const result = calculateFriendScore(friend);
      expect(result.score).toBeGreaterThan(5); // Should be high score
      expect(result.isUseful).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should mark friends as useful when score >= 2', () => {
      const friend = {
        interests: 'programming, web development' // Should give score of 2
      };

      const result = calculateFriendScore(friend);
      expect(result.isUseful).toBe(true);
    });

    it('should not mark friends as useful when score < 2', () => {
      const friend = {
        about: 'I like music and art' // No programming keywords
      };

      const result = calculateFriendScore(friend);
      expect(result.isUseful).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle friends with minimal data', () => {
      const friend = {};
      const result = calculateFriendScore(friend);
      expect(result.score).toBe(0);
      expect(result.isUseful).toBe(false);
      expect(result.reasons).toEqual([]);
    });
  });

  describe('keywords arrays', () => {
    it('should have programming keywords', () => {
      expect(PROGRAMMING_KEYWORDS).toContain('programming');
      expect(PROGRAMMING_KEYWORDS).toContain('javascript');
      expect(PROGRAMMING_KEYWORDS).toContain('developer');
    });

    it('should have tech universities', () => {
      expect(TECH_UNIVERSITIES).toContain('mit');
      expect(TECH_UNIVERSITIES).toContain('мгту');
    });

    it('should have tech faculties', () => {
      expect(TECH_FACULTIES).toContain('computer science');
      expect(TECH_FACULTIES).toContain('информатик');
    });

    it('should have tech occupations', () => {
      expect(TECH_OCCUPATIONS).toContain('developer');
      expect(TECH_OCCUPATIONS).toContain('программист');
    });
  });
});