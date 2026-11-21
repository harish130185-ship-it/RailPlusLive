import fs from 'fs';

const content = fs.readFileSync('app-server.mjs', 'utf8');
const idx = content.indexOf('async function providerGet');
console.log(content.slice(idx, idx + 1000));
