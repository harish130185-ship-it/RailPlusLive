import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const start = html.indexOf('id="booking-flow-modal"');
const end = html.indexOf('<!-- Passenger Master', start);
console.log(html.slice(start, end));
