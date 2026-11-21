import fs from 'fs';

const appJs = fs.readFileSync('website/app.js', 'utf8');
const lines = appJs.split('\n');
console.log('Total lines:', lines.length);
console.log(lines.slice(-40).join('\n'));
