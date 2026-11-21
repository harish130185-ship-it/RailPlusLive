import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const start = html.indexOf('<section class="hero-booking-card"');
const end = html.indexOf('<!-- Quick Shortcuts Row -->', start);
console.log(html.slice(start, end));
