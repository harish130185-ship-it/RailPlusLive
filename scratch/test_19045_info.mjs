import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

async function test19045() {
  const sdk = await import('railkit');
  sdk.configure(key);
  try {
    const info = await sdk.getTrainInfo('19045');
    console.log('Train info success:', info?.success);
    if (info?.data?.route) {
      console.log('Route stops count:', info.data.route.length);
      const stIdx = info.data.route.findIndex(s => s.stnCode === 'ST');
      const shgIdx = info.data.route.findIndex(s => s.stnCode === 'SHG');
      console.log('ST stop index:', stIdx);
      console.log('SHG stop index:', shgIdx);
      if (stIdx !== -1 && shgIdx !== -1) {
        console.log('ST station name:', info.data.route[stIdx].stnName);
        console.log('SHG station name:', info.data.route[shgIdx].stnName);
      }
    }
  } catch (e) {
    console.error('Info error:', e.message);
  }
}

test19045();
