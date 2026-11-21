import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

appJs = appJs.replace(
  `  const trainInput = $('train-input');`,
  `  const trainInput = $('train-number-input') || $('train-input');`
);

appJs = appJs.replace(
  `  if ($('train-input')) setupTrainAutocomplete($('train-input'), true);`,
  `  const liveTrainEl = $('train-number-input') || $('train-input');\n  if (liveTrainEl) setupTrainAutocomplete(liveTrainEl, true);`
);

appJs = appJs.replace(
  `    const rawTrain = (trainInput?.value || '').trim();`,
  `    const rawTrain = (trainInput?.value || $('train-number-input')?.value || '').trim();`
);

// Check if there are other occurrences
appJs = appJs.replace(
  `const counter = $(\`\${input.id === 'train-input' ? 'train-counter' : ''}\`);`,
  `const counter = $(\`\${(input.id === 'train-input' || input.id === 'train-number-input') ? 'train-counter' : ''}\`);`
);

try {
  new vm.Script(appJs);
  fs.writeFileSync('website/app.js', appJs);
  console.log('Successfully updated trainInput references in app.js');
} catch (err) {
  console.error('SYNTAX ERROR:', err.message);
}
