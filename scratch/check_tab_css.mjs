import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('tab-btn') || l.includes('secondary-tab') || l.includes('tab-panel')) {
    console.log(i + 1, l);
  }
});
