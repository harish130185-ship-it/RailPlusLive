import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const css = fs.readFileSync('website/styles.css', 'utf8');

const headerStart = html.indexOf('<header');
const headerEnd = html.indexOf('</header>') + 9;
console.log('=== HEADER HTML ===');
console.log(html.slice(headerStart, headerEnd));

const footerStart = html.indexOf('<footer');
const footerEnd = html.indexOf('</footer>') + 9;
console.log('=== FOOTER HTML ===');
console.log(html.slice(footerStart, footerEnd));
