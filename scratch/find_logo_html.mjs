import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');
const lines = html.split('\n');
for (let i = 0; i < 70; i++) {
  if (lines[i].includes('logo') || lines[i].includes('brand')) {
    console.log(i + 1, lines[i]);
  }
}
