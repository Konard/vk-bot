const fs = require('fs');
const path = require('path');

function groupMessages(messages) {
  const groupedMessages = [];
  let currentUserId = null;
  let currentText = '';
  let currentDate = '';

  messages.forEach(message => {
    const date = new Date(message.date * 1000).toISOString().replace('T', ' ').substring(0, 19);
    const fromId = message.from_id;
    let text = message.text.replace(/\n/g, '  \n'); // Convert newlines to Markdown line breaks

    if (message.reply_message) {
      const replyText = message.reply_message.text.replace(/\n/g, '  \n').split('\n').map(line => `> ${line}`).join('\n');
      text = `${replyText}\n\n${text}`;
    }

    if (fromId !== currentUserId) {
      if (currentUserId !== null) {
        groupedMessages.push(`# [User ${currentUserId}](https://vk.com/id${currentUserId}) [${currentDate}]:\n${currentText}\n`);
      }
      currentUserId = fromId;
      currentText = text;
      currentDate = date;
    } else {
      currentText += `\n\n${text}`;
      currentDate = date;
    }
  });

  if (currentUserId !== null) {
    groupedMessages.push(`# [User ${currentUserId}](https://vk.com/id${currentUserId}) [${currentDate}]:\n${currentText}\n`);
  }

  return groupedMessages;
}

function convertMessagesToMarkdown(friendId) {
  const jsonFilePath = path.join(__dirname, 'data', 'friends', 'messages', `${friendId}.json`);
  const markdownFilePath = path.join(__dirname, 'data', 'friends', 'messages', `${friendId}.md`);

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`JSON file for friend ${friendId} does not exist.`);
    process.exit(1);
  }

  const messages = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')).reverse();
  const markdownLines = groupMessages(messages);

  fs.writeFileSync(markdownFilePath, markdownLines.join('\n'), 'utf-8');
  console.log(`Markdown file for friend ${friendId} saved to ${markdownFilePath}`);
}

const friendId = process.argv[2];
if (!friendId) {
  console.error('Please provide the friend ID as an argument.');
  process.exit(1);
}

convertMessagesToMarkdown(friendId);