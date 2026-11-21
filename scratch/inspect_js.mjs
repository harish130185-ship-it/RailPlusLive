import fs from 'node:fs';

const js = fs.readFileSync('website/app.js', 'utf-8');
const lines = js.split('\n');
console.log('=== APP.JS SECTIONS ===');
lines.forEach((line, i) => {
  if (line.includes('====') || line.startsWith('  function ') || line.startsWith('function ')) {
    console.log(`${i + 1}: ${line.trim().slice(0, 80)}`);
  }
});
