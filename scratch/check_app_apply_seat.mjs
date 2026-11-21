import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf('function applySeatDataToCard');
console.log(content.slice(idx, idx + 800));
