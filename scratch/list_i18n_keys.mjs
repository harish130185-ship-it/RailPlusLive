import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const i18nKeys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]))];
console.log(JSON.stringify(i18nKeys, null, 2));
