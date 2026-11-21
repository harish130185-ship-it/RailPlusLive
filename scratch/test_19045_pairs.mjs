import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

async function testPairs() {
  const sdk = await import('railkit');
  sdk.configure(key);
  
  const pairs = [
    { from: 'ST', to: 'SHG' },
    { from: 'ST', to: 'CPR' },
    { from: 'ST', to: 'BSB' },
    { from: 'ST', to: 'JNU' }
  ];

  for (const p of pairs) {
    try {
      const res = await sdk.getAvailability('19045', p.from, p.to, '13-12-2026', 'SL', 'GN');
      console.log(`${p.from} -> ${p.to}: success=${res?.success}`, res?.data?.availability?.[0]?.availabilityText || res?.error);
    } catch (e) {
      console.log(`${p.from} -> ${p.to}: err=${e.message}`);
    }
  }
}

testPairs();
