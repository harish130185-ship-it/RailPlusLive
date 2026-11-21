import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf('function renderRoute');
console.log(content.slice(idx + 3200, idx + 4800));
