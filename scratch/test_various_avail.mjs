import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

async function testVarious() {
  const sdk = await import('railkit');
  sdk.configure(key);
  
  const tests = [
    { no: '12952', from: 'NDLS', to: 'MMCT', date: '25-11-2026', cls: '3A' },
    { no: '12952', from: 'NDLS', to: 'MMCT', date: '25-11-2026', cls: '2A' },
    { no: '12954', from: 'NZM', to: 'MMCT', date: '25-11-2026', cls: '3A' },
    { no: '12904', from: 'NZM', to: 'BDTS', date: '25-11-2026', cls: 'SL' },
    { no: '19045', from: 'ST', to: 'SHG', date: '25-11-2026', cls: 'SL' },
    { no: '19045', from: 'ST', to: 'BSB', date: '25-11-2026', cls: 'SL' },
    { no: '12555', from: 'GKP', to: 'NDLS', date: '25-11-2026', cls: 'SL' }
  ];

  for (const t of tests) {
    try {
      const res = await sdk.getAvailability(t.no, t.from, t.to, t.date, t.cls, 'GN');
      console.log(`${t.no} ${t.from}->${t.to} ${t.cls}: success=${res.success}`, res.success ? `status=${res.data?.availability?.[0]?.availabilityText} fare=${res.data?.fare?.totalFare}` : res.error);
    } catch (e) {
      console.log(`${t.no} error: ${e.message}`);
    }
  }
}

testVarious();
