import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const lines = html.split('\n');
console.log(lines.slice(230, 345).join('\n'));
