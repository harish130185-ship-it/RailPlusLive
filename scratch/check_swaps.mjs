import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
console.log('Has swap-seats-stations:', content.includes('swap-seats-stations'));
console.log('Has swap-fare-stations:', content.includes('swap-fare-stations'));
