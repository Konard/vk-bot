// Programming-related keywords and patterns to detect programmers
const programmingKeywords = [
  // Programming languages
  'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
  'kotlin', 'typescript', 'scala', 'perl', 'haskell', 'dart', 'elixir', 'clojure',

  // Technologies and frameworks
  'react', 'angular', 'vue', 'node', 'django', 'flask', 'spring', 'laravel',
  'express', 'fastapi', 'rails', 'asp.net', 'nextjs', 'nuxt', 'svelte',

  // Development concepts
  'api', 'backend', 'frontend', 'fullstack', 'database', 'sql', 'nosql',
  'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
  'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'devops',
  'algorithm', 'data structure', 'leetcode', 'hackerrank',

  // Programming terms (Russian)
  'программирование', 'программист', 'разработчик', 'разработка',
  'код', 'кодинг', 'баг', 'дебаг', 'репозиторий', 'коммит',
  'пулреквест', 'деплой', 'бэкенд', 'фронтенд', 'фулстек',

  // Programming terms (English)
  'programming', 'programmer', 'developer', 'development', 'coding',
  'code', 'bug', 'debug', 'repository', 'commit', 'pull request',
  'deploy', 'deployment', 'software', 'engineer', 'engineering',

  // Common development phrases
  'npm install', 'pip install', 'yarn add', 'import ', 'require(',
  'function ', 'const ', 'let ', 'var ', 'class ', 'async ', 'await ',
];

// Regular expressions for code patterns
const codePatterns = [
  /\bfunction\s+\w+\s*\(/i,
  /\bconst\s+\w+\s*=/i,
  /\blet\s+\w+\s*=/i,
  /\bvar\s+\w+\s*=/i,
  /\bimport\s+.*\s+from\s+/i,
  /\brequire\s*\(/i,
  /\bclass\s+\w+/i,
  /\basync\s+function/i,
  /=>/, // Arrow functions
  /\{\s*\.\.\.\w+\s*\}/, // Spread operator
  /\w+\.\w+\(.*\)/, // Method calls
  /\/\/ .+/, // Single-line comments
  /\/\*.+\*\//, // Multi-line comments
  /```[\s\S]*```/, // Code blocks in markdown
];

/**
 * Detects if a person is a programmer based on their message history
 * @param {Array} messages - Array of message objects from VK API
 * @returns {Object} - { isProgrammer: boolean, confidence: number, indicators: Array }
 */
function detectProgrammer(messages) {
  if (!messages || messages.length === 0) {
    return { isProgrammer: false, confidence: 0, indicators: [] };
  }

  const indicators = [];
  let keywordMatches = 0;
  let codePatternMatches = 0;

  for (const message of messages) {
    const text = message.text?.toLowerCase() || '';

    // Skip very short messages
    if (text.length < 3) {
      continue;
    }

    // Check for programming keywords
    for (const keyword of programmingKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        keywordMatches++;
        indicators.push({ type: 'keyword', value: keyword, messageId: message.id });
        break; // Count only once per message
      }
    }

    // Check for code patterns
    for (const pattern of codePatterns) {
      if (pattern.test(message.text || '')) {
        codePatternMatches++;
        indicators.push({ type: 'pattern', value: pattern.toString(), messageId: message.id });
        break; // Count only once per message
      }
    }
  }

  // Calculate confidence based on matches
  const totalMatches = keywordMatches + (codePatternMatches * 2); // Code patterns weighted more
  const messagesChecked = messages.length;
  const matchRatio = totalMatches / messagesChecked;

  // Determine if programmer
  // If at least 3 matches or 5% of messages contain programming content
  const isProgrammer = totalMatches >= 3 || matchRatio >= 0.05;

  // Confidence score (0-100)
  const confidence = Math.min(100, Math.round(matchRatio * 1000 + totalMatches * 10));

  return {
    isProgrammer,
    confidence,
    indicators: indicators.slice(0, 10), // Return top 10 indicators
    stats: {
      totalMessages: messagesChecked,
      keywordMatches,
      codePatternMatches,
      totalMatches,
      matchRatio: Math.round(matchRatio * 10000) / 100, // Percentage
    }
  };
}

module.exports = {
  detectProgrammer,
  programmingKeywords,
  codePatterns,
};
