import fs from 'fs';

const content = fs.readFileSync('app-server.mjs', 'utf8');
const idx = content.indexOf('function normalizeAvailability');
console.log(content.slice(idx + 500, idx + 1400));
