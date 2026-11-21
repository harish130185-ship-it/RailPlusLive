import fs from 'fs';

const content = fs.readFileSync('app-server.mjs', 'utf8');
const idx = content.indexOf('async function providerCall');
console.log(content.slice(idx, idx + 800));
