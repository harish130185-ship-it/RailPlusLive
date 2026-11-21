import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const matches = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('Total IDs:', matches.length);
console.log('Sample IDs:', matches.filter(id => 
  id.includes('lang') || 
  id.includes('theme') || 
  id.includes('pass') || 
  id.includes('journey') || 
  id.includes('book') || 
  id.includes('dash') || 
  id.includes('modal') || 
  id.includes('swap') || 
  id.includes('chip') ||
  id.includes('install')
));
