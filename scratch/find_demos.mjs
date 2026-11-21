import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const appJs = fs.readFileSync('website/app.js', 'utf8');

const htmlDemo = [...html.matchAll(/(.{0,30}(?:demo|sample|काल्पनिक).{0,30})/gi)].map(m => m[0]);
console.log('HTML demo/sample occurrences (' + htmlDemo.length + '):');
htmlDemo.slice(0, 15).forEach(s => console.log(' - ' + s.trim()));
