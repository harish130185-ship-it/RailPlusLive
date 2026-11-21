import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');
const idx = css.indexOf('.autocomplete-dropdown');
console.log('Position of autocomplete-dropdown in css:', idx);
if (idx !== -1) {
  console.log(css.slice(idx, idx + 800));
}
