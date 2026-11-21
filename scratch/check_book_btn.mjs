import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf('.btn-book-train');
console.log(content.slice(idx, idx + 1000));
