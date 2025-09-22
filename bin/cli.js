#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');

yargs(hideBin(process.argv))
  .command({
    command: 'greet-friends [count]',
    describe: 'Greet friends with automatic messages',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Maximum number of friends to greet',
          type: 'number',
          default: 0
        })
        .option('order-by', {
          type: 'string',
          choices: ['total-friends', 'default'],
          default: 'default',
          describe: 'Order friends by specified criteria'
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      const greetFriends = require('../greet-friends');
      process.argv = ['node', 'greet-friends.js', argv.count, `--order-by=${argv.orderBy}`];
      // Execute the greet-friends script
      require('../greet-friends');
    }
  })
  .command({
    command: 'accept-suggestions [count]',
    describe: 'Accept friend suggestions automatically',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Maximum number of suggestions to accept',
          type: 'number',
          default: 0
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      process.argv = ['node', 'accept-best-suggestion.js', argv.count];
      require('../accept-best-suggestion');
    }
  })
  .command({
    command: 'delete-requests [count]',
    describe: 'Delete outgoing friend requests',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Maximum number of requests to delete',
          type: 'number',
          default: 0
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      process.argv = ['node', 'delete-outgoing-requests.js', argv.count];
      require('../delete-outgoing-requests');
    }
  })
  .command({
    command: 'add-friends [count]',
    describe: 'Add friends from community members',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Target number of friends to add',
          type: 'number',
          default: 0
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      process.argv = ['node', 'friends.js', argv.count];
      require('../friends');
    }
  })
  .command({
    command: 'convert-messages <friend-id>',
    describe: 'Convert messages to markdown format',
    builder: (yargs) => {
      return yargs
        .positional('friend-id', {
          describe: 'ID of the friend to convert messages for',
          type: 'string',
          demandOption: true
        });
    },
    handler: async (argv) => {
      process.argv = ['node', 'convert-messages-to-markdown.js', argv.friendId];
      require('../convert-messages-to-markdown');
    }
  })
  .command({
    command: 'load-messages <friend-id>',
    describe: 'Load messages for a specific friend',
    builder: (yargs) => {
      return yargs
        .positional('friend-id', {
          describe: 'ID of the friend to load messages for',
          type: 'string',
          demandOption: true
        });
    },
    handler: async (argv) => {
      process.argv = ['node', 'load-messages.js', argv.friendId];
      require('../load-messages');
    }
  })
  .command({
    command: 'ask-links [count]',
    describe: 'Ask friends about links theory',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Maximum number of friends to ask',
          type: 'number',
          default: 0
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      process.argv = ['node', 'ask-about-links-theory.js', argv.count];
      require('../ask-about-links-theory');
    }
  })
  .command({
    command: 'ask-music [count]',
    describe: 'Ask friends about music preferences',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Maximum number of friends to ask',
          type: 'number',
          default: 0
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      process.argv = ['node', 'do-you-like-this-music.js', argv.count];
      require('../do-you-like-this-music');
    }
  })
  .command({
    command: 'help-friends [count]',
    describe: 'Ask friends how you can help them',
    builder: (yargs) => {
      return yargs
        .positional('count', {
          describe: 'Maximum number of friends to ask',
          type: 'number',
          default: 0
        });
    },
    handler: async (argv) => {
      if (argv.count <= 0) {
        console.log('Please specify a count greater than 0');
        return;
      }
      process.argv = ['node', 'how-can-i-help-you.js', argv.count];
      require('../how-can-i-help-you');
    }
  })
  .command({
    command: 'reject-deactivated',
    describe: 'Reject friend requests from deactivated accounts',
    handler: async (argv) => {
      require('../reject-deactivated-friend-requests');
    }
  })
  .command({
    command: 'send-invitations',
    describe: 'Send invitation posts',
    handler: async (argv) => {
      require('../send-invitation-posts');
    }
  })
  .command({
    command: 'cache',
    describe: 'Cache management commands',
    builder: (yargs) => {
      return yargs
        .command('friends', 'Update friends cache', {}, () => {
          require('../friends-cache');
        })
        .command('conversations', 'Update friends conversations cache', {}, () => {
          require('../friends-conversations-cache');
        })
        .command('count', 'Update friends count cache', {}, () => {
          require('../friends-count-cache');
        })
        .command('messages', 'Update messages cache', {}, () => {
          require('../messages-cache');
        })
        .command('functions', 'Update functions cache', {}, () => {
          require('../functions-cache');
        })
        .demandCommand(1, 'You need to specify a cache command');
    }
  })
  .command({
    command: 'stickers',
    describe: 'Sticker management commands',
    builder: (yargs) => {
      return yargs
        .command('filter', 'Filter stickers', {}, () => {
          require('../filter-stickers');
        })
        .command('load', 'Load usable sticker packs', {}, () => {
          require('../load-usable-sticker-packs');
        })
        .command('list', 'List stickers', {}, () => {
          require('../stickers');
        })
        .demandCommand(1, 'You need to specify a stickers command');
    }
  })
  .command({
    command: 'start',
    describe: 'Start the VK bot listener',
    handler: async (argv) => {
      console.log('Starting VK bot...');
      require('../index');
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .argv;