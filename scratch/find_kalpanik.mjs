import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const idx = content.indexOf('काल्पनिक');
if (idx !== -1) {
  console.log(content.slice(idx - 100, idx + 200));
} else {
  console.log('No काल्पनिक found in app.js');
}
