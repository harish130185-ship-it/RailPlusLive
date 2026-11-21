import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf('async function fetchLive');
console.log(content.slice(idx, idx + 800));
