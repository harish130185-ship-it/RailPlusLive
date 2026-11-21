import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

// Unescape escaped template strings
appJs = appJs.replace(/\\`/g, '`');
appJs = appJs.replace(/\\\$\{/g, '${');

// Remove trailing backtick before })();
appJs = appJs.replace(/`;\s*\n\s*\n\(\)\s*=>\s*\{/g, '');
appJs = appJs.replace(/`;\s*\n*\(\)\s*;\s*$/g, '})();');
appJs = appJs.replace(/`;\s*\n*\(\)\(\);\s*$/g, '})();');

// Let's test lines at the very end
if (appJs.includes('`;\n\n\n})();')) {
  appJs = appJs.replace('`;\n\n\n})();', '})();');
}
if (appJs.includes('`;\n\n})();')) {
  appJs = appJs.replace('`;\n\n})();', '})();');
}

try {
  new vm.Script(appJs);
  console.log('SUCCESS: website/app.js parsed with zero syntax errors!');
  fs.writeFileSync('website/app.js', appJs);
} catch (err) {
  console.error('STILL ERROR:', err.message);
}
