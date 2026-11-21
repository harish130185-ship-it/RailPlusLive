import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('काल्पनिक') || l.includes('Demo Mode') || l.includes('Sample Mode')) {
    console.log(i + 1, l);
  }
});
