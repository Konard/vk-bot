const { VK } = require('vk-io');
const { sleep, getToken, second, ms } = require('./utils');

const token = getToken();
const vk = new VK({ token });

// Get target ID and type from command line arguments
const targetId = process.argv[2];
const targetType = process.argv[3] || 'group'; // 'group' or 'user'

if (!targetId) {
  console.log('Usage: node count-deactivated-followers.js <target_id> [type]');
  console.log('  target_id: ID of the group or user');
  console.log('  type: "group" (default) or "user"');
  console.log('');
  console.log('Examples:');
  console.log('  node count-deactivated-followers.js 54530371 group');
  console.log('  node count-deactivated-followers.js 123456789 user');
  process.exit(1);
}

const BATCH_SIZE = 1000;
const MAX_FOLLOWERS = 100000; // Safety limit

async function fetchGroupMembers(groupId, offset = 0, count = BATCH_SIZE) {
  try {
    const response = await vk.api.groups.getMembers({
      group_id: groupId,
      fields: ['deactivated'],
      offset,
      count
    });
    return response;
  } catch (error) {
    console.error(`Error fetching group members at offset ${offset}:`, error.message);
    return { items: [], count: 0 };
  }
}

async function fetchUserFollowers(userId, offset = 0, count = BATCH_SIZE) {
  try {
    const response = await vk.api.users.getFollowers({
      user_id: userId,
      fields: ['deactivated'],
      offset,
      count
    });
    return response;
  } catch (error) {
    console.error(`Error fetching user followers at offset ${offset}:`, error.message);
    return { items: [], count: 0 };
  }
}

async function countDeactivatedFollowers(targetId, targetType) {
  let totalCount = 0;
  let deactivatedCount = 0;
  let offset = 0;
  let hasMoreData = true;

  console.log(`Starting to count deactivated followers for ${targetType} ${targetId}...`);

  while (hasMoreData && offset < MAX_FOLLOWERS) {
    let response;

    if (targetType === 'group') {
      response = await fetchGroupMembers(targetId, offset);
    } else if (targetType === 'user') {
      response = await fetchUserFollowers(targetId, offset);
    } else {
      throw new Error(`Invalid target type: ${targetType}. Use 'group' or 'user'.`);
    }

    const { items, count: totalAvailable } = response;

    if (!items || items.length === 0) {
      hasMoreData = false;
      break;
    }

    // Count deactivated users in this batch
    const deactivatedInBatch = items.filter(user =>
      user.deactivated && (user.deactivated === 'banned' || user.deactivated === 'deleted')
    );

    deactivatedCount += deactivatedInBatch.length;
    totalCount += items.length;

    console.log(`Processed ${totalCount} ${targetType === 'group' ? 'members' : 'followers'}, found ${deactivatedCount} deactivated (${deactivatedInBatch.length} in this batch)`);

    // Check if we've reached the end
    offset += BATCH_SIZE;
    if (items.length < BATCH_SIZE || offset >= totalAvailable) {
      hasMoreData = false;
    }

    // Rate limiting to avoid API limits
    await sleep((200) / ms); // 200ms delay between requests
  }

  return {
    totalCount,
    deactivatedCount,
    activeCount: totalCount - deactivatedCount,
    deactivatedPercentage: totalCount > 0 ? ((deactivatedCount / totalCount) * 100).toFixed(2) : 0
  };
}

async function main() {
  try {
    console.log(`Analyzing ${targetType} ${targetId} for deactivated followers...`);

    const results = await countDeactivatedFollowers(targetId, targetType);

    console.log('\n=== RESULTS ===');
    console.log(`Target: ${targetType} ${targetId}`);
    console.log(`Total ${targetType === 'group' ? 'members' : 'followers'}: ${results.totalCount}`);
    console.log(`Active ${targetType === 'group' ? 'members' : 'followers'}: ${results.activeCount}`);
    console.log(`Deactivated ${targetType === 'group' ? 'members' : 'followers'}: ${results.deactivatedCount}`);
    console.log(`Deactivated percentage: ${results.deactivatedPercentage}%`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();