import fs from 'fs';

const content = fs.readFileSync('website/app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('resetAllForms') || l.includes('header-logo') || l.includes('brand')) {
    console.log(i + 1, l);
  }
});
