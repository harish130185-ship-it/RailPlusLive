import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('setupStationAutocomplete') || l.includes('route-from') || l.includes('route-to')) {
    console.log(i + 1, l);
  }
});
