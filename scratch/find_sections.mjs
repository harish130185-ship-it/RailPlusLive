import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<section') || l.includes('hero-booking')) {
    console.log(i + 1, l);
  }
});
