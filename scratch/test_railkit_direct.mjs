import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

console.log('Key exists:', !!key);

async function testDirect() {
  const sdk = await import('railkit');
  sdk.configure(key);

  console.log('Testing getAvailability for 19045 from ST to SHG date 13-12-2026 class SL...');
  try {
    const res = await sdk.getAvailability('19045', 'ST', 'SHG', '13-12-2026', 'SL', 'GN');
    console.log('Result 19045:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error 19045:', err.message);
  }

  console.log('\nTesting getAvailability for 12952 NDLS to MMCT 25-11-2026 3A GN...');
  try {
    const res = await sdk.getAvailability('12952', 'NDLS', 'MMCT', '25-11-2026', '3A', 'GN');
    console.log('Result 12952:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error 12952:', err.message);
  }
}

testDirect();
