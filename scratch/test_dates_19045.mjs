import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

async function testDates() {
  const sdk = await import('railkit');
  sdk.configure(key);
  
  const testDatesList = [
    '22-11-2026', // Tomorrow (Sunday)
    '23-11-2026', // Monday
    '25-11-2026', // Wednesday
    '27-11-2026', // Friday
    '29-11-2026', // Sunday
    '02-12-2026', // Next week Wednesday
    '13-12-2026'
  ];

  for (const dt of testDatesList) {
    try {
      const res = await sdk.getAvailability('19045', 'ST', 'SHG', dt, 'SL', 'GN');
      console.log(`Date ${dt}: success=${res?.success}`, res?.data ? `Avail: ${res.data.availability?.[0]?.availabilityText}` : `Error: ${res?.error}`);
    } catch (e) {
      console.log(`Date ${dt}: Error ${e.message}`);
    }
  }
}

testDates();
