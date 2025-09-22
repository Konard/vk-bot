# Useful Friends Metrics Script

This script analyzes your VK friends to identify those with programming interests or technical backgrounds.

## Features

- **Multi-criteria Analysis**: Evaluates friends based on:
  - Education (tech universities and CS/IT faculties)
  - Occupation (programming/tech-related jobs)
  - Profile text (interests, activities, about sections)

- **Intelligent Scoring**: Uses weighted scoring system:
  - Tech universities: 3 points
  - Tech faculties: 2 points
  - Tech occupations: 4 points
  - Programming keywords in interests/activities: 2 points each
  - Programming keywords in about section: 1 point

- **Smart Keyword Detection**: Uses word boundaries to prevent false positives from short keywords

## Usage

### Prerequisites

1. Make sure you have a VK API token file named `token` in the project root
2. Install dependencies: `npm install`
3. Populate the friends cache first by running other friends-related scripts

### Running the Script

```bash
node useful-friends-metrics.js
```

### Output

The script will:
1. Load your friends from cache
2. Fetch detailed information from VK API (education, occupation, interests)
3. Analyze each friend using the scoring algorithm
4. Generate a detailed report showing:
   - Total number of friends analyzed
   - Number and percentage of "useful" friends (score ≥ 2)
   - Top 20 useful friends with details and reasons
5. Save detailed results to `useful-friends-report.json`

### Example Output

```
=== USEFUL FRIENDS METRICS REPORT ===

Total friends analyzed: 150
Useful friends (programming interest): 23
Percentage: 15.3%

=== TOP USEFUL FRIENDS ===

1. John Smith (@johnsmith)
   Score: 12
   Online: Yes
   Last seen: 12/22/2024
   Can message: Yes
   Reasons:
     - Tech university: MIT
     - Tech faculty: Computer Science
     - Tech occupation: Software Engineer
     - Programming keywords in interests: "JavaScript, React, Node.js..."
```

## Testing

Run the test suite:
```bash
npm test useful-friends-metrics.test.js
```

Run the example experiment:
```bash
node experiments/test-useful-friends-metrics.js
```

## Keywords Detected

The script looks for these types of indicators:

### Programming Languages & Technologies
- JavaScript, Python, Java, React, Node.js, etc.
- Git, GitHub, API, database

### Job Titles & Roles
- Developer, programmer, engineer, analyst
- Data scientist, QA, DevOps, sysadmin

### Educational Background
- Computer Science, IT, Mathematics
- Tech universities (MIT, Stanford, МГТУ, etc.)

### General Tech Terms
- Programming, coding, software, algorithms
- Machine learning, AI, web development

## Rate Limiting

The script respects VK API rate limits by:
- Processing friends in batches of 100
- Adding 400ms delay between API requests
- Gracefully handling API errors

## Files Generated

- `useful-friends-report.json`: Detailed analysis results in JSON format
- Contains friend IDs, names, scores, reasons, and contact information