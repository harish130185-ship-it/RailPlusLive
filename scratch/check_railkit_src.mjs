import fs from 'fs';

const path = 'node_modules/railkit/dist/index.js';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  const idx = content.indexOf('getAvailability');
  console.log(content.slice(idx, idx + 800));
} else {
  console.log('Dist index not found, checking package.json');
  const pkg = JSON.parse(fs.readFileSync('node_modules/railkit/package.json', 'utf8'));
  console.log(pkg.main, pkg.module);
}
