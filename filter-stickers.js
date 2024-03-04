const fs = require("fs");

const data = JSON.parse(fs.readFileSync("received-attachments.json"));

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