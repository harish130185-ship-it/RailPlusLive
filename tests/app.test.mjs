import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, normalizePNR, normalizeTrain } from '../app-server.mjs';

const pnrMock = { success: true, data: {
  pnr: '1234567890', train: {number:'12951', name:'Example Express'},
  journey: {source:{name:'MUMBAI CENTRAL',code:'MMCT'}, destination:{name:'NEW DELHI',code:'NDLS'}, date:'20-11-2026'},
  chart: {status:'Not Prepared'}, passengers:[{booking:{status:'WL',details:'WL/18'},current:{status:'RAC',details:'RAC/04'}}]
} };
const trainMock = { success: true, data: {
  trainNo: '12951', trainName: 'Example Express', statusNote:'Departed SAMPLE (ABC)', lastUpdate:'19-Nov-2026 11:02 IST', currentStationCode:'ABC',
  progress:{percent:25}, timeline:[
    {type:'stoppage',status:'passed',stationCode:'SRC',stationName:'Origin',departure:{scheduled:'09:00',actual:'09:10',delay:'00:10'},platform:'1'},
    {type:'stoppage',status:'current',stationCode:'ABC',stationName:'Current Station',arrival:{scheduled:'11:00',actual:'11:13',delay:'00:13'},platform:'2'},
    {type:'stoppage',status:'upcoming',stationCode:'DST',stationName:'Destination',arrival:{scheduled:'13:00'}}
  ]
} };

test('normalize PNR status without exposing passenger identity', () => {
  const result = normalizePNR(pnrMock, '1234567890');
  assert.equal(result.trainNumber, '12951');
  assert.equal(result.chartStatus, 'Not Prepared');
  assert.equal(result.passengers[0].currentStatus, 'RAC/04');
  assert.equal(result.from, 'MUMBAI CENTRAL');
});

test('normalize train: last reported data, station time, delay', () => {
  const result = normalizeTrain(trainMock, '12951', '2026-11-19');
  assert.equal(result.currentStation, 'ABC');
  assert.equal(result.delayMinutes, 13);
  assert.equal(result.progressPercent, 25);
  assert.equal(result.stations[1].status, 'current');
  assert.equal(result.stations[2].status, 'upcoming');
});

async function withServer(options, run) {
  const server = createApp(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
}

test('missing API key: health states unavailable; live PNR returns explicit error', async () => {
  await withServer({apiKey:''}, async url => {
    const health = await (await fetch(`${url}/api/health`)).json();
    assert.equal(health.ready, false);
    const response = await fetch(`${url}/api/pnr`, {method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify({number:'1234567890'})});
    assert.equal(response.status, 503);
    assert.match((await response.json()).message, /API key/);
  });
});

test('PNR validates input and sends API key only to upstream', async () => {
  let upstreamPath = '';
  let upstreamKey = '';
  const fetchImpl = async (url, opts) => {
    upstreamPath = url; upstreamKey = opts.headers['x-api-key'];
    return new Response(JSON.stringify(pnrMock), {status:200,headers:{'Content-Type':'application/json'}});
  };
  await withServer({apiKey:'test-token',fetchImpl}, async url => {
    const response = await fetch(`${url}/api/pnr`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:'1234567890'})});
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.passengers[0].currentStatus,'RAC/04');
    assert.equal(upstreamPath,'https://api.railkit.in/api/v1/pnr/1234567890');
    assert.equal(upstreamKey,'test-token');
    const bad = await fetch(`${url}/api/pnr`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:'123'})});
    assert.equal(bad.status,400);
    const get = await fetch(`${url}/api/pnr?number=1234567890`);
    assert.equal(get.status,405);
  });
});

test('train calls RailKit with DD-MM-YYYY start date in allowed window', async () => {
  let upstreamPath = '';
  const fetchImpl = async url => { upstreamPath=url; return new Response(JSON.stringify(trainMock), {status:200}); };
  await withServer({apiKey:'test-token',fetchImpl}, async url => {
    const date = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const result = await fetch(`${url}/api/train?number=12951&date=${date}`);
    assert.equal(result.status, 200);
    const obj = await result.json();
    assert.equal(obj.data.runningStatus, 'Departed SAMPLE (ABC)');
    const [y,m,d] = date.split('-');
    assert.equal(upstreamPath,`https://api.railkit.in/api/v1/trains/12951/live/${d}-${m}-${y}`);
    const future = await fetch(`${url}/api/train?number=12951&date=2099-01-01`);
    assert.equal(future.status,400);
  });
});

test('static site loads and API errors do not leak credentials', async () => {
  await withServer({apiKey:'private-key-123',fetchImpl:async()=>new Response('fail',{status:401})},async url=> {
    const page = await fetch(url);
    assert.equal(page.status,200);
    assert.match(await page.text(),/RailPulse/);
    const resp = await fetch(`${url}/api/pnr`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:'1234567890'})});
    const body = await resp.text();
    assert.equal(resp.status,502);
    assert.doesNotMatch(body,/private-key-123/);
    assert.equal(resp.headers.get('cache-control'),'private, no-store, max-age=0');
  });
});
