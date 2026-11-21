import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

// Replace all \` with `
// Replace all \${ with ${
appJs = appJs.replace(/\\`/g, '`');
appJs = appJs.replace(/\\\$\{/g, '${');

// Now let's test if appJs has valid JavaScript syntax
try {
  new vm.Script(appJs);
  console.log('SUCCESS: website/app.js is now 100% syntactically valid JavaScript!');
  fs.writeFileSync('website/app.js', appJs);
} catch (err) {
  console.error('SYNTAX ERROR:', err.message);
  console.error(err.stack);
}
