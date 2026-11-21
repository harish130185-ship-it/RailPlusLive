import fetch from 'node:test';

async function testApi() {
  const base = 'http://localhost:3000';
  console.log('Testing health...');
  try {
    const resH = await globalThis.fetch(`${base}/api/health`);
    console.log('Health:', await resH.json());
  } catch (e) {
    console.error('Health error:', e.message);
  }

  console.log('Testing PNR with 1234567890...');
  try {
    const resP = await globalThis.fetch(`${base}/api/pnr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: '1234567890' })
    });
    console.log('PNR status code:', resP.status);
    const bodyP = await resP.json();
    console.log('PNR response:', JSON.stringify(bodyP).slice(0, 300));
  } catch (e) {
    console.error('PNR error:', e.message);
  }

  console.log('Testing stations with "delhi"...');
  try {
    const resS = await globalThis.fetch(`${base}/api/stations?q=delhi`);
    console.log('Stations status code:', resS.status);
    const bodyS = await resS.json();
    console.log('Stations response count:', bodyS?.data?.stations?.length);
  } catch (e) {
    console.error('Stations error:', e.message);
  }

  console.log('Testing route NDLS to MMCT...');
  try {
    const resR = await globalThis.fetch(`${base}/api/route?from=NDLS&to=MMCT&date=2026-11-25`);
    console.log('Route status code:', resR.status);
    const bodyR = await resR.json();
    console.log('Route trains count:', bodyR?.data?.length);
  } catch (e) {
    console.error('Route error:', e.message);
  }
}

testApi();
