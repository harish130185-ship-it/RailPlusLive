import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');
console.log('Total lines in styles.css:', css.split('\n').length);
console.log(css.split('\n').slice(-40).join('\n'));
