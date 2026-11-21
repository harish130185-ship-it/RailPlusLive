import fs from 'fs';

const html = fs.readFileSync('website/index.html', 'utf8');

// Find all modals
const modals = [...html.matchAll(/id="([^"]*modal[^"]*)"/gi)].map(m => m[1]);
console.log('Modals found:', modals);

// Find all buttons
const buttons = [...html.matchAll(/<button[^>]*id="([^"]+)"[^>]*>/gi)].map(m => m[1]);
console.log('Buttons found:', buttons);

// Find all inputs and selects
const inputs = [...html.matchAll(/<(?:input|select)[^>]*id="([^"]+)"[^>]*>/gi)].map(m => m[1]);
console.log('Inputs/Selects found:', inputs);

// Find all data-i18n attributes
const i18nKeys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]))];
console.log('data-i18n keys found (' + i18nKeys.length + '):', i18nKeys.slice(0, 30));

const i18nPhKeys = [...new Set([...html.matchAll(/data-i18n-ph="([^"]+)"/g)].map(m => m[1]))];
console.log('data-i18n-ph keys found (' + i18nPhKeys.length + '):', i18nPhKeys);
