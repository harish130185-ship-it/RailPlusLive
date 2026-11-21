import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const idx = html.indexOf('id="pnr-form"');
console.log(html.slice(idx - 300, idx + 800));
