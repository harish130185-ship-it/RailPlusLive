import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

async function testFare() {
  const sdk = await import('railkit');
  sdk.configure(key);
  try {
    const res = await sdk.fareLookup('19045', 'ST', 'SHG', '25-11-2026', 'SL', 'GN');
    console.log('Fare result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('Fare error:', e.message);
  }
}

testFare();
