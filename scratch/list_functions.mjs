import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');

// List function definitions
const fns = [...content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
console.log('Defined functions (' + fns.length + '):', fns);
