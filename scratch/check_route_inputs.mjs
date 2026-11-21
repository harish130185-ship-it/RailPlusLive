import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const idx = html.indexOf('id="route-from-input"');
console.log(html.slice(idx - 150, idx + 450));
