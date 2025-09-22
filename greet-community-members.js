const { VK } = require('vk-io');
const { getToken } = require('./utils');
const { trigger: greetCommunityMembersTrigger } = require('./triggers/greet-community-members');

const token = getToken();
const vk = new VK({ token });

const maxGreetings = Number(process.argv[2]) || 50;

async function main() {
  console.log(`Starting to greet community members (max: ${maxGreetings})...`);

  try {
    await greetCommunityMembersTrigger.action({
      vk,
      options: { maxGreetings }
    });

    console.log('Community greeting completed!');
  } catch (error) {
    console.error('Error greeting community members:', error);
  }
}

main();