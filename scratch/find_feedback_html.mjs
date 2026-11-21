import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const idx = html.indexOf('id="feedback"');
console.log('Position of feedback in index.html:', idx);
console.log(html.slice(idx - 200, idx + 400));
