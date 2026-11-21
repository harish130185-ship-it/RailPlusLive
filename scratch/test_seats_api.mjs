import fetch from 'node:test';

async function testSeats() {
  const base = 'http://localhost:3000';
  const url = `${base}/api/seats?number=19045&from=ST&to=SHG&date=2026-12-13&class=SL&quota=GN`;
  console.log('Fetching:', url);
  try {
    const res = await globalThis.fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testSeats();
