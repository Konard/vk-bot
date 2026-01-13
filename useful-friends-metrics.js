const { VK } = require('vk-io');
const { getToken, sleep, second, ms, saveJsonSync, readJsonSync } = require('./utils');
const { getAllFriends } = require('./friends-cache');

// Keywords to identify programming/tech interest
const PROGRAMMING_KEYWORDS = [
  'программирование', 'programming', 'developer', 'разработчик', 'разработка',
  'javascript', 'python', 'java', 'react', 'node', 'frontend', 'backend',
  'fullstack', 'веб-разработка', 'web development', 'код', 'code', 'coding',
  'софтвер', 'software', 'it', 'айти', 'computer science', 'tech stack',
  'технологии', 'github', 'git', 'api', 'database', 'базы данных',
  'алгоритм', 'algorithm', 'data structure', 'структуры данных',
  'машинное обучение', 'machine learning', 'ai', 'artificial intelligence'
];

const TECH_UNIVERSITIES = [
  'мгту', 'мифи', 'мэи', 'мгимо', 'итмо', 'спбгу', 'мфти', 'бауманка',
  'мит', 'mit', 'stanford', 'berkeley', 'carnegie', 'georgia tech'
];

const TECH_FACULTIES = [
  'информатик', 'программирование', 'computer science', 'cs', 'it',
  'математик', 'физик', 'инженер', 'technology', 'технолог'
];

const TECH_OCCUPATIONS = [
  'программист', 'developer', 'разработчик', 'инженер', 'engineer',
  'analyst', 'аналитик', 'тестировщик', 'tester', 'qa', 'devops',
  'системный администратор', 'sysadmin', 'data scientist', 'дата сайентист'
];

function containsKeywords(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    // Use word boundaries for short keywords that might be substrings
    if (lowerKeyword.length <= 3) {
      const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
      return regex.test(text);
    }
    return lowerText.includes(lowerKeyword);
  });
}

function analyzeEducation(universities, schools) {
  let score = 0;
  let reasons = [];

  if (universities) {
    for (const uni of universities) {
      if (uni.university_name && containsKeywords(uni.university_name, TECH_UNIVERSITIES)) {
        score += 3;
        reasons.push(`Tech university: ${uni.university_name}`);
      }
      if (uni.faculty_name && containsKeywords(uni.faculty_name, TECH_FACULTIES)) {
        score += 2;
        reasons.push(`Tech faculty: ${uni.faculty_name}`);
      }
    }
  }

  if (schools) {
    for (const school of schools) {
      if (school.name && containsKeywords(school.name, ['лицей', 'гимназия', 'физмат', 'математическ'])) {
        score += 1;
        reasons.push(`Tech-oriented school: ${school.name}`);
      }
    }
  }

  return { score, reasons };
}

function analyzeOccupation(occupation) {
  if (!occupation || !occupation.name) return { score: 0, reasons: [] };

  if (containsKeywords(occupation.name, TECH_OCCUPATIONS)) {
    return {
      score: 4,
      reasons: [`Tech occupation: ${occupation.name}`]
    };
  }

  return { score: 0, reasons: [] };
}

function analyzeTextFields(user) {
  let score = 0;
  let reasons = [];

  const fieldsToCheck = [
    { field: 'interests', weight: 2, name: 'interests' },
    { field: 'activities', weight: 2, name: 'activities' },
    { field: 'about', weight: 1, name: 'about' }
  ];

  for (const fieldInfo of fieldsToCheck) {
    const text = user[fieldInfo.field];
    if (text && containsKeywords(text, PROGRAMMING_KEYWORDS)) {
      score += fieldInfo.weight;
      reasons.push(`Programming keywords in ${fieldInfo.name}: "${text.substring(0, 100)}..."`);
    }
  }

  return { score, reasons };
}

function calculateFriendScore(friend) {
  let totalScore = 0;
  let allReasons = [];

  // Analyze education
  const educationAnalysis = analyzeEducation(friend.universities, friend.schools);
  totalScore += educationAnalysis.score;
  allReasons.push(...educationAnalysis.reasons);

  // Analyze occupation
  const occupationAnalysis = analyzeOccupation(friend.occupation);
  totalScore += occupationAnalysis.score;
  allReasons.push(...occupationAnalysis.reasons);

  // Analyze text fields
  const textAnalysis = analyzeTextFields(friend);
  totalScore += textAnalysis.score;
  allReasons.push(...textAnalysis.reasons);

  return {
    score: totalScore,
    reasons: allReasons,
    isUseful: totalScore >= 2 // Threshold for being considered "useful"
  };
}

async function loadFriendDetails(vk, friendIds, batchSize = 100) {
  const allFriends = [];
  const fields = [
    'education', 'universities', 'schools', 'occupation', 'interests',
    'activities', 'about', 'first_name', 'last_name', 'screen_name',
    'can_write_private_message', 'last_seen', 'online'
  ];

  for (let i = 0; i < friendIds.length; i += batchSize) {
    const batch = friendIds.slice(i, i + batchSize);
    console.log(`Loading details for friends ${i + 1}-${Math.min(i + batchSize, friendIds.length)} of ${friendIds.length}...`);

    try {
      const response = await vk.api.users.get({
        user_ids: batch.join(','),
        fields: fields.join(',')
      });

      allFriends.push(...response);

      // Rate limiting - VK API allows 3 requests per second
      if (i + batchSize < friendIds.length) {
        await sleep(400); // Wait 400ms between requests
      }
    } catch (error) {
      console.error(`Error loading batch ${i}-${i + batchSize}:`, error.message);
      // Continue with next batch
    }
  }

  return allFriends;
}

function generateReport(analysisResults) {
  const usefulFriends = analysisResults.filter(result => result.analysis.isUseful);
  const totalFriends = analysisResults.length;

  console.log('\n=== USEFUL FRIENDS METRICS REPORT ===\n');
  console.log(`Total friends analyzed: ${totalFriends}`);
  console.log(`Useful friends (programming interest): ${usefulFriends.length}`);
  console.log(`Percentage: ${((usefulFriends.length / totalFriends) * 100).toFixed(1)}%\n`);

  if (usefulFriends.length > 0) {
    console.log('=== TOP USEFUL FRIENDS ===\n');

    // Sort by score descending
    const sortedUseful = usefulFriends.sort((a, b) => b.analysis.score - a.analysis.score);

    sortedUseful.slice(0, 20).forEach((result, index) => {
      const friend = result.friend;
      const analysis = result.analysis;

      console.log(`${index + 1}. ${friend.first_name} ${friend.last_name} (@${friend.screen_name || friend.id})`);
      console.log(`   Score: ${analysis.score}`);
      console.log(`   Online: ${friend.online ? 'Yes' : 'No'}`);
      if (friend.last_seen) {
        const lastSeen = new Date(friend.last_seen.time * 1000);
        console.log(`   Last seen: ${lastSeen.toLocaleDateString()}`);
      }
      console.log(`   Can message: ${friend.can_write_private_message ? 'Yes' : 'No'}`);
      console.log(`   Reasons:`);
      analysis.reasons.forEach(reason => {
        console.log(`     - ${reason}`);
      });
      console.log();
    });
  }

  // Save detailed results to file
  const reportData = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFriends,
      usefulFriends: usefulFriends.length,
      percentage: ((usefulFriends.length / totalFriends) * 100).toFixed(1)
    },
    usefulFriends: usefulFriends.map(result => ({
      id: result.friend.id,
      name: `${result.friend.first_name} ${result.friend.last_name}`,
      screenName: result.friend.screen_name,
      score: result.analysis.score,
      reasons: result.analysis.reasons,
      online: result.friend.online,
      lastSeen: result.friend.last_seen,
      canMessage: result.friend.can_write_private_message
    }))
  };

  const reportPath = './useful-friends-report.json';
  saveJsonSync(reportPath, reportData);
  console.log(`\nDetailed report saved to: ${reportPath}`);

  return reportData;
}

async function main() {
  try {
    console.log('Starting useful friends metrics analysis...\n');

    // Initialize VK API client
    const token = getToken();
    const vk = new VK({ token });

    // Load friends from cache
    const context = { vk };
    const friends = await getAllFriends({ context });

    if (!friends || friends.length === 0) {
      console.log('No friends found in cache. Please run friends-cache.js first.');
      return;
    }

    console.log(`Found ${friends.length} friends in cache.`);

    // Extract friend IDs
    const friendIds = friends.map(friend => friend.id);

    // Load detailed information for all friends
    console.log('Loading detailed friend information...');
    const detailedFriends = await loadFriendDetails(vk, friendIds);

    console.log(`Loaded details for ${detailedFriends.length} friends.`);

    // Analyze each friend
    console.log('Analyzing friends for programming interest...');
    const analysisResults = detailedFriends.map(friend => ({
      friend,
      analysis: calculateFriendScore(friend)
    }));

    // Generate and display report
    const report = generateReport(analysisResults);

    console.log('\nAnalysis complete!');

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  calculateFriendScore,
  analyzeEducation,
  analyzeOccupation,
  analyzeTextFields,
  containsKeywords,
  PROGRAMMING_KEYWORDS,
  TECH_UNIVERSITIES,
  TECH_FACULTIES,
  TECH_OCCUPATIONS
};