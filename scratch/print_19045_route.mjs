import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

async function printRoute() {
  const sdk = await import('railkit');
  sdk.configure(key);
  const info = await sdk.getTrainInfo('19045');
  console.log('Train Name:', info?.data?.trainName);
  console.log('Stops:');
  info?.data?.route?.forEach((s, i) => {
    console.log(`${i+1}. ${s.stnCode} - ${s.stnName} (Arr: ${s.arrTime}, Dep: ${s.depTime}, Day: ${s.dayCount})`);
  });
}

printRoute();
