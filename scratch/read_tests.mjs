import fs from 'fs';

const testCode = fs.readFileSync('tests/app.test.mjs', 'utf8');
console.log(testCode);
