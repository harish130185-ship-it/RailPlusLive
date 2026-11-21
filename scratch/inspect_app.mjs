import fs from 'node:fs';

const html = fs.readFileSync('website/index.html', 'utf-8');
const lines = html.split('\n');
console.log('=== HTML STRUCTURE ===');
lines.forEach((line, i) => {
  if (/<(header|nav|main|footer|section|aside|form)/i.test(line) || /id="(tab-|pwa-|demo-|modal)/.test(line)) {
    console.log(`${i + 1}: ${line.trim().slice(0, 100)}`);
  }
});
