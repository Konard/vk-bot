const fs = require("fs");

let data;
try {
  data = JSON.parse(fs.readFileSync("received-attachments.json"));
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`Error: File "received-attachments.json" not found. Please make sure the file exists and the path is correct.`);
  } else if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
    console.error(`Error: File "received-attachments.json" contains invalid JSON. Please check the file format and syntax.`);
  } else {
    console.error(`Error: Unable to read file "received-attachments.json". ${error.message}`);
  }
  process.exit(1);
}

const uniqueProducts = {};

for (const key in data) {
  if (Object.hasOwnProperty.call(data, key)) {
    const element = data[key];
    if (!element.productId) {
      delete data[key];
    } else {
      if (!uniqueProducts[element.productId]) {
        uniqueProducts[element.productId] = true;
      }
    }
  }
}

const products = [];

for (const key in uniqueProducts) {
  if (Object.hasOwnProperty.call(uniqueProducts, key)) {
    products.push(key);
  }
}

console.log(uniqueProducts);

fs.writeFileSync("stickers.json", JSON.stringify(data, null, 2));
fs.writeFileSync("products.json", JSON.stringify(products, null, 2));