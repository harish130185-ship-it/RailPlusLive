import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');

const headerBlockStart = css.indexOf('.app-header');
console.log(css.slice(headerBlockStart, headerBlockStart + 600));
