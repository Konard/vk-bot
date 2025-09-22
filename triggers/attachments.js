const fs = require('fs');

const targetPath = 'received-attachments.json';

let receivedAttachments = {};
if (fs.existsSync(targetPath)) {
    try {
        const rawData = fs.readFileSync(targetPath);
        receivedAttachments = JSON.parse(rawData);

        // Clean on start up
        for (const propName in receivedAttachments) {
          if (receivedAttachments[propName]) {
            receivedAttachments[propName] = clean(receivedAttachments[propName]);
          }
        }
    } catch (error) {
        if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
            console.error(`Error: File "${targetPath}" contains invalid JSON. Please check the file format and syntax. Starting with empty attachments.`);
        } else {
            console.error(`Error: Unable to read file "${targetPath}". ${error.message}. Starting with empty attachments.`);
        }
        receivedAttachments = {};
    }
}

function clean(obj) {
  for (var propName in obj) { 
    if (obj[propName] === null || obj[propName] === undefined || obj[propName]?.length === 0) {
      delete obj[propName];
    }
    // if(typeof obj[propName] === 'object'){
    //   clean(obj[propName]); //recursive for nested objects
    // }
  }
  return obj;
}

function eraseMetadata(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function saveToFile() {
  fs.writeFileSync(targetPath, JSON.stringify(receivedAttachments, null, 2));
}

const trigger = {
  name: "AttachmentsTrigger",
  condition: (context) => {
    return !context?.request?.isOutbox
        && context?.request?.attachments?.length > 0;
  },
  action: (context) => {
    let newAttachments = false;
    for (let attachment of context.request.attachments) {
      const attachmentType = typeof attachment;
      console.log('attachmentType', attachmentType);
      attachment = eraseMetadata(attachment);
      console.log('attachment', 'before clean', attachment);
      attachment = clean(attachment);
      console.log('attachment', 'after clean', attachment);
      const id = attachment?.id;
      if (id && !receivedAttachments[id]) {
        receivedAttachments[id] = attachment;
        console.log('attachment?.images', JSON.stringify(attachment?.images || null, null, 2));
        console.log('attachment?.imagesWithBackground', JSON.stringify(attachment?.imagesWithBackground || null, null, 2));
        console.log('attachment?.images?.length', attachment?.images?.length);
        console.log('attachment?.imagesWithBackground?.length', attachment?.imagesWithBackground?.length);
        newAttachments = true;
      }
    }
    if (newAttachments) {
      saveToFile();
    }
  }
};

module.exports = {
  trigger
};