import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('header') || l.includes('footer')) {
    if (l.includes('{') || l.includes('.')) {
      console.log(i + 1, l.slice(0, 80));
    }
  }
});
