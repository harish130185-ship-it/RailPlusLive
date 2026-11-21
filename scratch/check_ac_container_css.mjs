import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');
const idx = css.indexOf('.autocomplete-container');
console.log('Position of autocomplete-container in css:', idx);
if (idx !== -1) {
  console.log(css.slice(idx, idx + 400));
}
