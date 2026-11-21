import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');

// Find all occurrences of demo buttons in index.html
const demoMatches = [...html.matchAll(/id="demo-[^"]+"/g)].map(m => m[0]);
console.log('Demo buttons in index.html:', demoMatches);

// Find where forms are located
console.log('Form locations in index.html:');
['pnr-form', 'route-form', 'seats-form', 'train-form', 'fare-form'].forEach(f => {
  const pos = html.indexOf(`id="${f}"`);
  console.log(`${f}: position ${pos}`);
});
