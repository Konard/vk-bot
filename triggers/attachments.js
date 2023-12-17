const fs = require('fs');

const targetPath = 'received-attachments.json';

let receivedAttachments = {};
if (fs.existsSync(targetPath)) {
    const rawData = fs.readFileSync(targetPath);
    receivedAttachments = JSON.parse(rawData);
}

function isEmptyArray(arr) {
  arr = arr.filter(item => !(item === null || item === undefined || item === '')); 
  return arr.length == 0;
}

function clean(obj) {
  for (var propName in obj) { 
    if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '' ||
       (Array.isArray(obj[propName]) && isEmptyArray(obj[propName]))  // check for empty arrays
      ) {
      delete obj[propName];
    }
    // if(typeof obj[propName] === 'object'){
    //   clean(obj[propName]); //recursive for nested objects
    // }
  }
  return obj;
}

const attachmentsTrigger = {
  condition: (context) => {
    return context?.request?.attachments?.length > 0;
  },
  action: (context) => {
    let newAttachments = false;
    for (let attachment of context.request.attachments) {
      console.log('attachment', 'before clean', attachment);
      attachment = clean(attachment);
      console.log('attachment', 'after clean', attachment);
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