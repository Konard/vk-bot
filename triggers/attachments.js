const fs = require('fs');

const targetPath = 'received-attachments.json';

let receivedAttachments = {};
if (fs.existsSync(targetPath)) {
    const rawData = fs.readFileSync(targetPath);

    // Clean on start up
    for (const propName in rawData) {
      if (rawData[propName]) {
        rawData[propName] = clean(rawData[propName]);
      }
    }

    receivedAttachments = JSON.parse(rawData);
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

const attachmentsTrigger = {
  condition: (context) => {
    return context?.request?.attachments?.length > 0;
  },
  action: (context) => {
    let newAttachments = false;
    for (let attachment of context.request.attachments) {
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
      fs.writeFileSync(targetPath, JSON.stringify(receivedAttachments, null, 2));
    }
  }
};

module.exports = {
  attachmentsTrigger
};