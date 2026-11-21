import fs from 'fs';

const content = fs.readFileSync('scratch/build_index.mjs', 'utf8');
const ids = [...content.matchAll(/id="([^"]+)"/g)].map(m => m[1]);

console.log('Total IDs in build_index.mjs:', ids.length);
const mustHaves = [
  'pnr-form', 'pnr-input', 'route-form', 'route-from-input', 'route-to-input', 'route-date-input',
  'seats-form', 'train-form', 'fare-form', 'lang-selector', 'btn-theme-toggle',
  'booking-flow-modal', 'passenger-master-modal', 'saved-journeys-modal', 'user-dashboard-modal',
  'header-install-btn', 'btn-hero-swap-stations'
];

for (const id of mustHaves) {
  console.log(`${id}: ${ids.includes(id) ? 'FOUND' : 'MISSING'}`);
}
