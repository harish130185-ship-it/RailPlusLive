import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');

const check = [
  'nav-btn-passengers',
  'shortcut-passengers',
  'btn-shortcut-passengers',
  'nav-btn-journeys',
  'shortcut-saved',
  'btn-shortcut-saved',
  'shortcut-bookings',
  'btn-shortcut-bookings',
  'btn-open-dashboard',
  'btn-mobile-menu'
];

check.forEach(id => {
  console.log(`${id}: ${html.includes(`id="${id}"`) ? 'FOUND' : 'NOT FOUND'}`);
});
