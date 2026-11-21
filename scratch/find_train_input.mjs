import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('train-input') || l.includes('trainInput') || l.includes('train-number-input')) {
    console.log(i + 1, l);
  }
});
