import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');

function showModal(modalId) {
  const start = html.indexOf(`id="${modalId}"`);
  if (start === -1) {
    console.log(`Modal ${modalId} not found!`);
    return;
  }
  const end = html.indexOf('</div>\n  </div>', start);
  console.log(`=== ${modalId} ===`);
  console.log(html.slice(start - 20, start + 1200));
}

showModal('passenger-master-modal');
showModal('saved-journeys-modal');
showModal('booking-flow-modal');
