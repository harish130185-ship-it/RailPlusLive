import fs from 'fs';

const content = fs.readFileSync('app-server.mjs', 'utf8');
const idx = content.indexOf("pathname === '/api/seats'");
console.log(content.slice(idx + 1400, idx + 3000));
