const { getRandomElement } = require('./utils');

const targetPath = 'received-attachments.json';

let receivedAttachments = {};
if (fs.existsSync(targetPath)) {
    const rawData = fs.readFileSync(targetPath);
    receivedAttachments = JSON.parse(rawData);
}

const attachmentsTrigger = {
  condition: (context) => {
    return context?.request?.attachments?.length > 0;
  },
  action: (context) => {
    let newAttachments = false;
    for (const attachment of context.request.attachments) {
      console.log('new', 'attachment', attachment);
      const id = attachment?.id;
      if (id && !receivedAttachments[id]) { 
        receivedAttachments[id] = sticker;
        newAttachments = true;
      }
    }
    if (newAttachments) {
      fs.writeFileSync(targetPath, JSON.stringify(stickers, null, 2));
    }
  }
};

module.exports = {
  attachmentsTrigger
};