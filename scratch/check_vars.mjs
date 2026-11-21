import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');
const idx = css.indexOf(':root');
console.log(css.slice(idx, idx + 800));
