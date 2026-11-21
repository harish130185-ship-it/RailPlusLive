import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf("document.querySelectorAll('.class-card').forEach");
console.log(content.slice(idx, idx + 1000));
