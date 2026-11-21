import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

const target = `  $('nav-btn-passengers')?.addEventListener('click', openPassengerModal);`;
const addition = `  $('shortcut-passenger-master')?.addEventListener('click', openPassengerModal);
  $('shortcut-saved-journeys')?.addEventListener('click', openJourneysModal);
  $('shortcut-booking-history')?.addEventListener('click', openDashboardModal);
  $('shortcut-pnr-status')?.addEventListener('click', () => {
    switchTab('pnr');
    $('pnr-input')?.focus();
  });
`;

if (!appJs.includes('shortcut-passenger-master')) {
  appJs = appJs.replace(target, addition + '\n' + target);
  new vm.Script(appJs);
  fs.writeFileSync('website/app.js', appJs);
  console.log('Successfully wired all homepage shortcut cards!');
}
