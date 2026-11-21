import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf('function renderPNR');
console.log(content.slice(idx, idx + 1800));
