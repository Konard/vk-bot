const {
  getAllProgrammerStatuses,
  getProgrammerStatus,
} = require('../programmer-status-cache');

/**
 * View all programmer statuses or a specific friend's status
 * Usage:
 *   node experiments/view-programmer-statuses.js           # View all
 *   node experiments/view-programmer-statuses.js [friendId] # View specific
 */
async function viewProgrammerStatuses() {
  const friendId = process.argv[2];

  try {
    if (friendId) {
      // View specific friend's status
      console.log(`Viewing programmer status for friend ID: ${friendId}`);
      console.log('='.repeat(60));

      const status = await getProgrammerStatus(friendId);

      if (status) {
        console.log('\nStatus:', JSON.stringify(status, null, 2));
      } else {
        console.log('\n⚠️  No status found for this friend.');
      }
    } else {
      // View all statuses
      console.log('Viewing all programmer statuses:');
      console.log('='.repeat(60));

      const allStatuses = await getAllProgrammerStatuses();
      const statusEntries = Object.entries(allStatuses);

      if (statusEntries.length === 0) {
        console.log('\n⚠️  No statuses found in cache.');
        return;
      }

      console.log(`\nTotal friends with status: ${statusEntries.length}\n`);

      // Count by category
      let programmers = 0;
      let nonProgrammers = 0;
      let unknown = 0;
      let asked = 0;

      statusEntries.forEach(([friendId, status]) => {
        if (status.isProgrammer === true) programmers++;
        else if (status.isProgrammer === false) nonProgrammers++;
        else unknown++;

        if (status.askedAt) asked++;
      });

      console.log('Summary:');
      console.log(`  ✓ Confirmed Programmers: ${programmers}`);
      console.log(`  ✗ Confirmed Non-Programmers: ${nonProgrammers}`);
      console.log(`  ? Unknown: ${unknown}`);
      console.log(`  📧 Asked (pending response): ${asked}`);

      console.log('\n' + '-'.repeat(60));
      console.log('Detailed List:\n');

      statusEntries.forEach(([friendId, status]) => {
        const isProg = status.isProgrammer === true ? '✓' :
                       status.isProgrammer === false ? '✗' : '?';
        const asked = status.askedAt ? '📧' : '  ';
        const confidence = status.confidence || 0;
        const method = status.method || 'unknown';

        console.log(`${isProg} ${asked} Friend ${friendId}: confidence=${confidence}%, method=${method}`);
      });
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error viewing statuses:', error);
    process.exit(1);
  }
}

// Run the viewer
viewProgrammerStatuses();
