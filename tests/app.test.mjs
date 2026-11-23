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

test('route, seats, and fare use RailKit SDK with validated station/date inputs', async () => {
  const calls = [];
  const sdkImpl = {
    configure: key => calls.push(['configure', key]),
    stationsByName: async (...args) => {
      calls.push(['stations', ...args]);
      return {success:true,data:{stations:[{code:'NDLS',name:'NEW DELHI'},{code:'DLI',name:'DELHI'}]}};
    },
    searchTrainBetweenStations: async (...args) => {
      calls.push(['route', ...args]);
      return {success:true,data:[{train_no:'12951',train_name:'Example Express',from_stn_name:'NEW DELHI',to_stn_name:'MUMBAI CENTRAL',from_time:'16:55',to_time:'08:35',travel_time:'15:40 hrs'}]};
    },
    getAvailability: async (...args) => {
      calls.push(['seats', ...args]);
      return {success:true,data:{train:{trainNo:'12951',trainName:'Example Express',fromStationName:'NEW DELHI',toStationName:'MUMBAI CENTRAL'},fare:{totalFare:1200},availability:[{date:'20-11-2026',availabilityText:'AVAILABLE 12',prediction:'High'}]}};
    },
    fareLookup: async (...args) => {
      calls.push(['fare', ...args]);
      return {success:true,data:{trainNo:'12951',trainName:'Example Express',from:'NDLS',to:'BCT',class:'3A',baseFare:1000,reservation:40,superfast:45,totalFare:1200}};
    }
  };
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [year, month, day] = today.split('-');
  const sdkDate = `${day}-${month}-${year}`;
  await withServer({apiKey:'test-token',sdkImpl}, async url => {
    const stations = await (await fetch(`${url}/api/stations?q=delhi`)).json();
    assert.deepEqual(stations.data.stations,[{code:'NDLS',name:'NEW DELHI'},{code:'DLI',name:'DELHI'}]);
    assert.deepEqual(calls.find(call => call[0] === 'stations'),['stations','delhi']);
    assert.equal((await fetch(`${url}/api/stations?q=x`)).status,400);

    const route = await (await fetch(`${url}/api/route?from=ndls&to=bct&date=${today}`)).json();
    assert.equal(route.data[0].trainNumber,'12951');
    assert.deepEqual(calls.find(call => call[0] === 'route'),['route','NDLS','BCT',sdkDate]);

    const seats = await (await fetch(`${url}/api/seats?number=12951&from=NDLS&to=BCT&date=${today}&class=3A&quota=GN`)).json();
    assert.equal(seats.data.availability[0].status,'AVAILABLE 12');
    assert.deepEqual(calls.find(call => call[0] === 'seats'),['seats','12951','NDLS','BCT',sdkDate,'3A','GN']);

    const fare = await (await fetch(`${url}/api/fare?number=12951&from=NDLS&to=BCT&date=${today}&class=3A&quota=GN`)).json();
    assert.equal(fare.data.totalFare,1200);
    assert.deepEqual(calls.find(call => call[0] === 'fare'),['fare','12951','NDLS','BCT',sdkDate,'3A','GN']);

    const invalid = await fetch(`${url}/api/seats?number=12951&from=NDLS&to=NDLS&date=${today}&class=3A&quota=GN`);
    assert.equal(invalid.status,400);
  });
});

test('seat lookup returns actual train stops when the requested stations are not served', async () => {
  let trainInfoCalls = 0;
  const sdkImpl = {
    configure() {},
    getAvailability: async () => ({success:false,error:'Unable to process your request'}),
    getTrainInfo: async () => {
      trainInfoCalls += 1;
      return {success:true,data:{route:[
        {stnCode:'ASR',stnName:'AMRITSAR'},
        {stnCode:'NZM',stnName:'HAZRAT NIZAMUDDIN'},
        {stnCode:'BDTS',stnName:'BANDRA TERMINUS'}
      ]}};
    }
  };
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  await withServer({apiKey:'test-token',sdkImpl}, async url => {
    const request = `${url}/api/seats?number=12904&from=NDLS&to=BCT&date=${today}&class=SL&quota=GN`;
    const first = await fetch(request);
    assert.equal(first.status,409);
    const body = await first.json();
    assert.match(body.message,/नहीं चलती/);
    assert.deepEqual(body.data.stations.map(station => station.code),['ASR','NZM','BDTS']);
    await fetch(request);
    assert.equal(trainInfoCalls,1);
  });
});

test('static site loads and API errors do not leak credentials', async () => {
  await withServer({apiKey:'private-key-123',fetchImpl:async()=>new Response('fail',{status:401})},async url=> {
    const page = await fetch(url);
    assert.equal(page.status,200);
    assert.match(await page.text(),/RailPlus/);
    const resp = await fetch(`${url}/api/pnr`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number:'1234567890'})});
    const body = await resp.text();
    assert.equal(resp.status,502);
    assert.doesNotMatch(body,/private-key-123/);
    assert.equal(resp.headers.get('cache-control'),'private, no-store, max-age=0');
  });
});

test('arithmetic human verification challenge generates and validates server-side', async () => {
  await withServer({}, async url => {
    const chResp = await fetch(`${url}/api/challenge`);
    assert.equal(chResp.status, 200);
    const chData = await chResp.json();
    assert.equal(chData.success, true);
    assert.ok(chData.question);
    assert.ok(chData.token);

    // Compute expected answer from question e.g. "8 + 3" or "10 - 4"
    const [a, op, b] = chData.question.split(' ');
    const ans = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);

    // Verify correct answer
    const vResp = await fetch(`${url}/api/challenge/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: chData.token, answer: ans })
    });
    assert.equal(vResp.status, 200);
    const vData = await vResp.json();
    assert.equal(vData.verified, true);

    // Verify wrong answer gets rejected
    const badResp = await fetch(`${url}/api/challenge/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: chData.token, answer: ans + 99 })
    });
    assert.equal(badResp.status, 400);
  });
});

test('auth/login stores IRCTC username only and rejects any password/OTP', async () => {
  await withServer({}, async url => {
    // 1. Password rejection (security requirement)
    const leakAttempt = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: '9876543210', irctcUsername: 'raj123', password: 'secretpassword' })
    });
    assert.equal(leakAttempt.status, 400);
    assert.match((await leakAttempt.json()).message, /सुरक्षा चेतावनी/);

    // 2. Valid mobile login with optional IRCTC username
    const validLogin = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: '9876543210', name: 'Raj Kumar', irctcUsername: 'raj_rail' })
    });
    assert.equal(validLogin.status, 200);
    const loginData = await validLogin.json();
    assert.equal(loginData.success, true);
    assert.equal(loginData.user.irctcUsername, 'raj_rail');
    assert.equal(loginData.user.emailOrMobile, '9876543210');
  });
});

test('passenger master is login-wise: isolated per user account and prevents data leaks', async () => {
  await withServer({}, async url => {
    // 1. User A logs in
    const loginA = await (await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: '9876543210', name: 'User A' })
    })).json();
    const userAId = loginA.user.id;

    // 2. User B logs in
    const loginB = await (await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrMobile: '9123456780', name: 'User B' })
    })).json();
    const userBId = loginB.user.id;

    assert.notEqual(userAId, userBId);

    // Clean test state for isolation test
    await fetch(`${url}/api/user/master/passengers?userId=${userAId}&all=true`, { method: 'DELETE' });
    await fetch(`${url}/api/user/master/passengers?userId=${userBId}&all=true`, { method: 'DELETE' });

    // 3. User A adds a passenger
    const addARes = await fetch(`${url}/api/user/master/passengers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userAId,
        passenger: { name: 'User A Family', age: 35, gender: 'Male', berth: 'Lower' }
      })
    });
    assert.equal(addARes.status, 200);

    // 4. User B checks their master list: MUST BE EMPTY, User A's data must NEVER be visible
    const resB = await fetch(`${url}/api/user/master/passengers?userId=${userBId}`);
    assert.equal(resB.status, 200);
    const getB = await resB.json();
    assert.equal(getB.passengers.length, 0);

    // 5. User B adds their own passenger
    const addB = await fetch(`${url}/api/user/master/passengers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userBId,
        passenger: { name: 'User B Friend', age: 24, gender: 'Female', berth: 'Upper' }
      })
    });
    assert.equal(addB.status, 200);

    // 6. User A checks their master list: MUST ONLY see User A's passenger
    const getA = await (await fetch(`${url}/api/user/master/passengers?userId=${userAId}`)).json();
    assert.equal(getA.passengers.length, 1);
    assert.equal(getA.passengers[0].name, 'User A Family');

    // 7. User B checks their master list: MUST ONLY see User B's passenger
    const getB2 = await (await fetch(`${url}/api/user/master/passengers?userId=${userBId}`)).json();
    assert.equal(getB2.passengers.length, 1);
    assert.equal(getB2.passengers[0].name, 'User B Friend');

    // 8. User A deletes their passenger: User B's passenger must remain intact
    const paxAId = getA.passengers[0].id;
    const delA = await fetch(`${url}/api/user/master/passengers?userId=${userAId}&id=${paxAId}`, {
      method: 'DELETE'
    });
    assert.equal(delA.status, 200);

    const getAAfterDel = await (await fetch(`${url}/api/user/master/passengers?userId=${userAId}`)).json();
    assert.equal(getAAfterDel.passengers.length, 0);

    const getBAfterDel = await (await fetch(`${url}/api/user/master/passengers?userId=${userBId}`)).json();
    assert.equal(getBAfterDel.passengers.length, 1);
    assert.equal(getBAfterDel.passengers[0].name, 'User B Friend');
  });
});

test('modular IRCTC gateway reports integration status and prepares booking assistance', async () => {
  await withServer({}, async url => {
    const statusResp = await fetch(`${url}/api/integration/status`);
    assert.equal(statusResp.status, 200);
    const status = await statusResp.json();
    assert.equal(status.mode, 'BOOKING_ASSISTANCE');

    const assistResp = await fetch(`${url}/api/booking/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainNumber: '12951',
        fromCode: 'NDLS',
        toCode: 'MMCT',
        date: '2026-11-25',
        cls: '3A',
        passengers: [{ name: 'Test Traveler', age: 28, gender: 'M', berth: 'Lower' }]
      })
    });
    assert.equal(assistResp.status, 200);
    const assistData = await assistResp.json();
    assert.equal(assistData.mode, 'BOOKING_ASSISTANCE');
    assert.equal(assistData.bookingPayload.trainNumber, '12951');
    assert.equal(assistData.bookingPayload.passengers[0].berth, 'Lower');
  });
});

test('analytics records visitor events, deduplicates spam, and protects admin dashboard', async () => {
  await withServer({}, async url => {
    // 1. Record first pageview
    const track1 = await fetch(`${url}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
      body: JSON.stringify({
        visitorId: 'vis_test_123',
        sessionId: 'sess_1',
        page: '#route',
        device: 'mobile',
        isReturning: false,
        referrer: 'direct'
      })
    });
    assert.equal(track1.status, 200);
    const res1 = await track1.json();
    assert.equal(res1.recorded, true);

    // 2. Duplicate pageview within 3 seconds should be deduplicated
    const trackDup = await fetch(`${url}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'vis_test_123',
        sessionId: 'sess_1',
        page: '#route',
        device: 'mobile'
      })
    });
    assert.equal(trackDup.status, 200);
    const resDup = await trackDup.json();
    assert.equal(resDup.recorded, false);
    assert.equal(resDup.reason, 'deduplicated');

    // 3. Different page should be recorded
    const track2 = await fetch(`${url}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: 'vis_test_123',
        sessionId: 'sess_1',
        page: '#pnr',
        device: 'mobile'
      })
    });
    assert.equal(track2.status, 200);
    assert.equal((await track2.json()).recorded, true);

    // 4. Admin analytics unauthorized access rejected
    const unauth = await fetch(`${url}/api/admin/analytics`);
    assert.equal(unauth.status, 401);

    const badKey = await fetch(`${url}/api/admin/analytics`, {
      headers: { 'x-admin-key': 'wrong_password' }
    });
    assert.equal(badKey.status, 401);

    // 5. Admin analytics authorized access succeeded with real data
    const auth = await fetch(`${url}/api/admin/analytics`, {
      headers: { 'x-admin-key': 'railplus_admin_2026' }
    });
    assert.equal(auth.status, 200);
    const stats = await auth.json();
    assert.equal(stats.success, true);
    assert.ok(stats.data.metrics.totalUniqueVisitors >= 1);
    assert.ok(stats.data.metrics.totalPageViews >= 2);
    assert.ok(stats.data.topPages.length > 0);
  });
});
