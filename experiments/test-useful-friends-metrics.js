const {
  calculateFriendScore,
  analyzeEducation,
  analyzeOccupation,
  analyzeTextFields,
  containsKeywords,
  PROGRAMMING_KEYWORDS
} = require('../useful-friends-metrics');

// Test data mimicking VK API response
const testFriends = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    universities: [
      { university_name: 'MIT', faculty_name: 'Computer Science' }
    ],
    occupation: { name: 'Software Engineer' },
    interests: 'Programming, JavaScript, React, Machine Learning',
    activities: 'Open source projects, coding challenges',
    about: 'Full-stack developer passionate about creating scalable web applications'
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    universities: [
      { university_name: 'Harvard University', faculty_name: 'Business Administration' }
    ],
    occupation: { name: 'Marketing Manager' },
    interests: 'Music, Travel, Photography',
    activities: 'Social media marketing, event planning',
    about: 'Marketing professional with a passion for creative campaigns'
  },
  {
    id: 3,
    first_name: 'Alex',
    last_name: 'Johnson',
    universities: [
      { university_name: 'МГТУ им. Баумана', faculty_name: 'Информатика и системы управления' }
    ],
    interests: 'Программирование, алгоритмы, разработка игр',
    about: 'Студент, изучаю веб-разработку и мобильные приложения'
  },
  {
    id: 4,
    first_name: 'Bob',
    last_name: 'Wilson',
    occupation: { name: 'Data Scientist' },
    interests: 'Machine learning, Python, AI',
    activities: 'Kaggle competitions, research papers'
  },
  {
    id: 5,
    first_name: 'Sarah',
    last_name: 'Brown',
    universities: [
      { university_name: 'Local Community College', faculty_name: 'Art' }
    ],
    interests: 'Painting, Drawing, Sculpture',
    activities: 'Art exhibitions, gallery visits',
    about: 'Artist working with traditional and digital media'
  }
];

function runTests() {
  console.log('=== TESTING USEFUL FRIENDS METRICS ===\n');

  testFriends.forEach((friend, index) => {
    console.log(`Friend ${index + 1}: ${friend.first_name} ${friend.last_name}`);
    const analysis = calculateFriendScore(friend);

    console.log(`Score: ${analysis.score}`);
    console.log(`Is Useful: ${analysis.isUseful ? 'YES' : 'NO'}`);
    console.log('Reasons:');
    analysis.reasons.forEach(reason => {
      console.log(`  - ${reason}`);
    });

    // Debug keyword detection
    console.log('Debug - Text analysis:');
    ['interests', 'activities', 'about'].forEach(field => {
      if (friend[field]) {
        const hasKeywords = containsKeywords(friend[field], PROGRAMMING_KEYWORDS);
        console.log(`  ${field}: "${friend[field]}" -> ${hasKeywords ? 'MATCH' : 'NO MATCH'}`);
      }
    });
    console.log('---\n');
  });

  // Test keyword detection
  console.log('=== KEYWORD DETECTION TESTS ===\n');

  const testTexts = [
    'I love programming and web development',
    'JavaScript and React developer',
    'Программирование на Python',
    'Music and art lover',
    'Software engineer at Google',
    'Студент МГТУ, изучаю информатику'
  ];

  testTexts.forEach(text => {
    const hasKeywords = containsKeywords(text, PROGRAMMING_KEYWORDS);
    console.log(`"${text}" -> ${hasKeywords ? 'HAS' : 'NO'} programming keywords`);
  });

  console.log('\n=== SUMMARY ===');
  const usefulFriends = testFriends.filter(friend => calculateFriendScore(friend).isUseful);
  console.log(`Total friends: ${testFriends.length}`);
  console.log(`Useful friends: ${usefulFriends.length}`);
  console.log(`Percentage: ${((usefulFriends.length / testFriends.length) * 100).toFixed(1)}%`);
}

runTests();