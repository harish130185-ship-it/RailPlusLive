import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

const oldStats = `    const elPax = $('dash-stat-passengers');
    const elRoutes = $('dash-stat-routes');
    const elBookings = $('dash-stat-bookings');`;

const newStats = `    const elPax = $('stat-passengers-count') || $('dash-stat-passengers');
    const elRoutes = $('stat-journeys-count') || $('dash-stat-routes');
    const elBookings = $('stat-bookings-count') || $('dash-stat-bookings');`;

if (appJs.includes(oldStats)) {
  appJs = appJs.replace(oldStats, newStats);
  new vm.Script(appJs);
  fs.writeFileSync('website/app.js', appJs);
  console.log('Successfully aligned dashboard stats IDs!');
} else {
  console.log('Stats IDs already updated or not found.');
}
