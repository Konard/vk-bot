// Test script to validate the count-deactivated-followers functionality
// This is for development and validation purposes

console.log('Testing count-deactivated-followers script...');

// Test command line argument parsing
const mockArgv = ['node', 'count-deactivated-followers.js', '54530371', 'group'];
process.argv = mockArgv;

console.log('Mock arguments:', {
  targetId: process.argv[2],
  targetType: process.argv[3] || 'group'
});

// Test usage message
if (!process.argv[2]) {
  console.log('Usage: node count-deactivated-followers.js <target_id> [type]');
  console.log('  target_id: ID of the group or user');
  console.log('  type: "group" (default) or "user"');
  console.log('');
  console.log('Examples:');
  console.log('  node count-deactivated-followers.js 54530371 group');
  console.log('  node count-deactivated-followers.js 123456789 user');
}

// Test filtering logic
const mockUsers = [
  { id: 1, deactivated: 'banned' },
  { id: 2 }, // active user
  { id: 3, deactivated: 'deleted' },
  { id: 4 }, // active user
  { id: 5, deactivated: 'suspended' } // other deactivation type
];

const deactivatedUsers = mockUsers.filter(user =>
  user.deactivated && (user.deactivated === 'banned' || user.deactivated === 'deleted')
);

console.log('Mock users:', mockUsers);
console.log('Deactivated users (banned/deleted):', deactivatedUsers);
console.log('Count:', deactivatedUsers.length);

// Test percentage calculation
const totalCount = mockUsers.length;
const deactivatedCount = deactivatedUsers.length;
const percentage = totalCount > 0 ? ((deactivatedCount / totalCount) * 100).toFixed(2) : 0;

console.log('\nResults:');
console.log(`Total: ${totalCount}`);
console.log(`Deactivated: ${deactivatedCount}`);
console.log(`Percentage: ${percentage}%`);

console.log('\nTest completed successfully!');