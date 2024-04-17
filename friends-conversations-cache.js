const { eraseMetadata, clean, readJsonSync, saveJsonSync } = require('./utils');

const targetPath = 'friends-conversations.json';

let friendsConversations = {};

if (fs.existsSync(targetPath)) {
  friendsConversations = readJsonSync(targetPath);
  console.log('Friend conversations cache loaded. Conversations in cache:', Object.keys(friendsConversations).length);
}

function update(updater) {
  updater(friendsConversations);
  saveJsonSync(targetPath, friendsConversations);
}

function getConversation(friendId) {
  return friendsConversations[friendId];
}

function setConversation(friendId, conversation) {
  update((conversations) => {
    conversations[friendId] = clean(eraseMetadata(conversation));
  });
}

module.exports = {
  getConversation,
  setConversation,
  update,
};