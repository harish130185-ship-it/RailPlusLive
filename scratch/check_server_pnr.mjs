import fs from 'fs';

const content = fs.readFileSync('app-server.mjs', 'utf8');
const idx = content.indexOf("pathname === '/api/pnr'");
console.log(content.slice(idx, idx + 1500));
