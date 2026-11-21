import fs from 'fs';

const content = fs.readFileSync('app-server.mjs', 'utf8');
const idx = content.indexOf('fromIndex');
console.log(content.slice(idx - 100, idx + 400));
