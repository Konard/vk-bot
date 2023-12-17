const fs = require('fs');

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
        receivedAttachments[id] = attachment;
        newAttachments = true;
      }
    }
    if (newAttachments) {
      fs.writeFileSync(targetPath, JSON.stringify(receivedAttachments, null, 2));
    }
  }
};

module.exports = {
  attachmentsTrigger
};