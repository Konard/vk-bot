const { second, minute, ms } = require('../time-units');
const { executeTrigger, getToken } = require('../utils');
const { trigger: sendCommunityMessagesTrigger } = require('../triggers/send-community-messages');
const { VK } = require('vk-io');

/**
 * Example of how to integrate the community messages trigger into the main bot
 * This shows how you would add it to index.js with periodic execution
 */

const token = getToken();
const vk = new VK({ token });

// Configuration for different community messaging campaigns
const campaigns = [
  {
    name: 'Developer Community Campaign',
    communityIds: [54530371], // Programming/development community
    schedule: 6 * 60 * minute, // Every 6 hours
    options: {
      maxMessages: 8,
      sendStickers: false,
      includeSticker: false,
      delayBetweenChecks: 1000,
    }
  },
  {
    name: 'Gaming Community Stickers',
    communityIds: [12345678, 87654321], // Gaming communities
    schedule: 12 * 60 * minute, // Every 12 hours
    options: {
      maxMessages: 5,
      sendStickers: true,
      includeSticker: false,
      delayBetweenChecks: 1500,
    }
  },
  {
    name: 'Art Community Mixed Messages',
    communityIds: [11111111], // Art community
    schedule: 8 * 60 * minute, // Every 8 hours
    options: {
      maxMessages: 6,
      sendStickers: false,
      includeSticker: true,
      delayBetweenChecks: 800,
    }
  }
];

/**
 * Set up periodic execution for community messaging campaigns
 */
function setupCommunityMessagingCampaigns() {
  console.log('🏗️  Setting up community messaging campaigns...');

  campaigns.forEach((campaign, index) => {
    console.log(`📅 Setting up campaign: ${campaign.name}`);
    console.log(`   Communities: ${campaign.communityIds.join(', ')}`);
    console.log(`   Schedule: Every ${campaign.schedule / (60 * minute)} hours`);
    console.log(`   Max messages: ${campaign.options.maxMessages}`);
    console.log(`   Mode: ${campaign.options.sendStickers ? 'Stickers only' :
      campaign.options.includeSticker ? 'Text + Stickers' : 'Text only'}`);

    // Create the periodic action
    const campaignAction = async () => {
      console.log(`🚀 Starting campaign: ${campaign.name}`);

      try {
        await executeTrigger(sendCommunityMessagesTrigger, {
          vk,
          options: {
            ...campaign.options,
            communityIds: campaign.communityIds,
          }
        });
        console.log(`✅ Campaign completed: ${campaign.name}`);
      } catch (error) {
        console.error(`❌ Error in campaign ${campaign.name}:`, error);
      }
    };

    // Set up the interval
    const interval = setInterval(campaignAction, campaign.schedule / ms);

    // Optional: Run the campaign immediately on startup (with delay to avoid conflicts)
    setTimeout(campaignAction, (index * 30 * second) / ms); // Stagger startup by 30 seconds per campaign

    console.log(`✅ Campaign ${campaign.name} scheduled\n`);
  });

  console.log('🎯 All community messaging campaigns are now active!');
}

/**
 * Example of how to add this to your main index.js file:
 *
 * // Add this import at the top
 * const { trigger: sendCommunityMessagesTrigger } = require('./triggers/send-community-messages');
 *
 * // Add this configuration after your other intervals
 * const sendCommunityMessagesInterval = setInterval(async () => {
 *   await executeTrigger(sendCommunityMessagesTrigger, {
 *     vk,
 *     options: {
 *       communityIds: [54530371, 12345678], // Your target communities
 *       maxMessages: 10,
 *       sendStickers: false,
 *       includeSticker: true,
 *       delayBetweenChecks: 1000,
 *     }
 *   });
 * }, (4 * 60 * minute) / ms); // Every 4 hours
 */

// Manual execution example
async function runManualCampaign() {
  console.log('🎯 Running manual campaign...\n');

  const manualOptions = {
    communityIds: [54530371], // Replace with actual community ID
    maxMessages: 3,
    sendStickers: false,
    includeSticker: false,
    delayBetweenChecks: 500,
  };

  await executeTrigger(sendCommunityMessagesTrigger, {
    vk,
    options: manualOptions
  });

  console.log('✅ Manual campaign completed!');
}

// Check command line arguments
const mode = process.argv[2] || 'manual';

if (mode === 'setup') {
  setupCommunityMessagingCampaigns();

  // Keep the process running
  console.log('📡 Bot is running with community messaging campaigns...');
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down community messaging campaigns...');
    process.exit(0);
  });
} else {
  runManualCampaign().catch(console.error);
}

/**
 * Usage:
 *
 * Run a single manual campaign:
 * node examples/integration-example.js
 *
 * Set up and run continuous campaigns:
 * node examples/integration-example.js setup
 */