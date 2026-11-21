import fs from 'fs';

let key = process.env.RAILKIT_API_KEY || '';
if (!key && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const m = envContent.match(/RAILKIT_API_KEY\s*=\s*(.+)/);
  if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
}

// Intercept fetch to see what URL railkit calls
const origFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  console.log('Intercepted Fetch URL:', url);
  console.log('Intercepted Fetch Headers:', opts?.headers);
  const resp = await origFetch(url, opts);
  const clone = resp.clone();
  console.log('Intercepted Response Status:', resp.status);
  try {
    const text = await clone.text();
    console.log('Intercepted Response Body:', text.slice(0, 300));
  } catch (_) {}
  return resp;
};

async function testFetch() {
  const sdk = await import('railkit');
  sdk.configure(key);
  try {
    const res = await sdk.getAvailability('19045', 'ST', 'SHG', '13-12-2026', 'SL', 'GN');
    console.log('SDK Result:', res);
  } catch (e) {
    console.log('SDK Catch:', e.message);
  }
}

testFetch();
