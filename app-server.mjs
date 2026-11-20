import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(ROOT, 'website');
const PROVIDER_DEFAULT = 'https://api.railkit.in';
const STATIC_FILES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/config.js', ['config.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/sw.js', ['sw.js', 'text/javascript; charset=utf-8']],
  ['/icon.svg', ['icon.svg', 'image/svg+xml']],
  ['/icon-192.png', ['icon-192.png', 'image/png']],
  ['/icon-512.png', ['icon-512.png', 'image/png']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json']]
]);

function text(value) {
  if (value === undefined || value === null || typeof value === 'object') return '';
  return String(value).trim();
}
function first(...values) { return values.map(text).find(Boolean) || ''; }
function stationName(node) {
  if (typeof node === 'string') return node;
  return first(node?.name, node?.stationName, node?.code, node?.stationCode);
}
function formatDateFromIso(iso) {
  if (!iso) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(iso)) return iso;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) { const [y,m,d] = iso.split('-'); return `${d}-${m}-${y}`; }
  return '';
}
function istDateParts(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date).reduce((obj, part) => (obj[part.type] = part.value, obj), {});
}
function daysAgoInIndia(dateInput) {
  const { year, month, day } = istDateParts();
  const today = Date.UTC(+year, +month - 1, +day);
  const [y, m, d] = dateInput.split('-').map(Number);
  if (!(y > 2000 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return NaN;
  const requested = Date.UTC(y, m - 1, d);
  if (new Date(requested).toISOString().slice(0, 10) !== dateInput) return NaN;
  return (today - requested) / 86_400_000;
}
function stripProviderError(status) {
  if (status === 400) return 'रेलवे डेटा सेवा को यह नंबर या तारीख स्वीकार नहीं हुई।';
  if (status === 401) return 'Railway API key सही नहीं है या उसकी अनुमति नहीं है।';
  if (status === 403) return 'Railway API provider ने access block किया है। Key का plan और SDK signature headers जाँचें।';
  if (status === 404) return 'इस नंबर और तारीख का रेलवे रिकॉर्ड नहीं मिला।';
  if (status === 429) return 'अभी API की request limit पूरी हो गई है। थोड़ी देर बाद जाँचें।';
  return 'रेलवे डेटा सेवा फिलहाल उपलब्ध नहीं है। कृपया बाद में कोशिश करें।';
}

export function normalizePNR(payload, number) {
  const source = payload?.data;
  if (!payload || payload.success === false || !source || typeof source !== 'object') throw Object.assign(new Error('PNR data not returned by provider'), { status: 502 });
  const details = source.journey || {};
  const passengers = Array.isArray(source.passengers) ? source.passengers : [];
  
  let chartStatus = first(source.chart?.status, source.chartStatus);
  if (!chartStatus && source.chartPrepared !== undefined) {
    chartStatus = source.chartPrepared ? 'Chart Prepared' : 'Chart Not Prepared';
  }

  return {
    pnr: number,
    trainNumber: first(source.train?.number, source.trainNo, source.trainNumber),
    trainName: first(source.train?.name, source.trainName),
    trainType: first(source.train?.type, source.trainType),
    from: stationName(details.source || source.source || source.from),
    to: stationName(details.destination || source.destination || source.to),
    boardingPoint: stationName(details.boardingPoint || source.boardingPoint || details.source || source.source),
    reservationUpto: stationName(details.reservationUpto || source.reservationUpto || details.destination || source.destination),
    chartingStation: stationName(source.chartingStation || source.chartingPoint || details.source || source.source),
    journeyClass: first(details.class, source.journeyClass, source.class),
    quota: first(details.quota, source.quota),
    journeyDate: first(details.date, details.journeyDate, source.journeyDate, source.date),
    chartStatus: chartStatus || 'Not reported',
    passengers: passengers.map((person) => ({
      bookingStatus: first(person?.booking?.details, person?.booking?.status, person?.bookingStatus) || 'Not reported',
      currentStatus: first(person?.current?.details, person?.current?.status, person?.currentStatus) || 'Not reported',
      coach: first(person?.coach, person?.current?.coach, person?.booking?.coach),
      berth: first(person?.berth, person?.berthNumber, person?.current?.berth, person?.booking?.berth),
      berthType: first(person?.berthType, person?.current?.berthType, person?.booking?.berthType)
    })),
    lastUpdated: first(source.lastUpdated, source.lastUpdate),
    source: 'RailKit',
    checkedAt: new Date().toISOString()
  };
}

function delayMinutes(input) {
  if (typeof input === 'number' && Number.isFinite(input)) return Math.round(input);
  const raw = text(input);
  if (/^\d{1,2}:\d{2}$/.test(raw)) { const [h,m] = raw.split(':').map(Number); return h * 60 + m; }
  if (/^\d+\s*(?:min|minutes)$/i.test(raw)) return parseInt(raw, 10);
  if (/^\d+$/.test(raw)) return Number(raw);
  return null;
}
export function normalizeTrain(payload, number, isoDate) {
  const src = payload?.data;
  if (!payload || payload.success === false || !src || typeof src !== 'object') throw Object.assign(new Error('Train data not returned by provider'), { status: 502 });
  const rawStations = Array.isArray(src.timeline) ? src.timeline : [];
  const currentCode = first(src.currentStationCode);
  const stops = rawStations.filter(item => item && typeof item === 'object' && (item.type !== 'intermediate' || item.stationCode === currentCode)).slice(0, 160);
  const stations = stops.map((s) => ({
    name: first(s.stationName, s.stationNameHindi, s.stationCode),
    code: text(s.stationCode),
    status: s.stationCode === currentCode && currentCode ? 'current' : (s.status === 'passed' ? 'passed' : 'upcoming'),
    scheduled: first(s.arrival?.scheduled, s.departure?.scheduled),
    expected: first(s.arrival?.actual, s.departure?.actual, s.arrival?.scheduled, s.departure?.scheduled),
    platform: first(s.platform),
    delayMinutes: delayMinutes(first(s.departure?.delay, s.arrival?.delay))
  }));
  const latestStop = [...stops].reverse().find(s => s.status === 'passed' || (currentCode && s.stationCode === currentCode));
  const inferredDelay = latestStop ? delayMinutes(first(latestStop.departure?.delay, latestStop.arrival?.delay)) : null;
  const rawProgress = Number(src.progress?.percent);
  return {
    trainNumber: first(src.trainNo, src.trainNumber, number),
    trainName: first(src.trainName, src.name),
    journeyDate: isoDate,
    runningStatus: first(src.statusNote, src.statusText, src.progress?.journeyStatus) || 'Not reported',
    delayMinutes: delayMinutes(src.delayMinutes) ?? inferredDelay,
    currentStation: currentCode || 'Not reported',
    lastUpdated: first(src.lastUpdate) || null,
    progressPercent: Number.isFinite(rawProgress) && src.progress?.percent !== undefined ? Math.max(0, Math.min(100, rawProgress)) : null,
    stations,
    source: 'RailKit',
    checkedAt: new Date().toISOString()
  };
}

function providerData(payload) {
  if (!payload || payload.success === false || payload.data === undefined || payload.data === null) {
    throw Object.assign(new Error('Railway data not returned by provider'), { status: 502 });
  }
  return payload.data;
}
function stationCode(value) {
  return text(value).toUpperCase();
}
function normalizeRoute(payload) {
  const data = providerData(payload);
  if (!Array.isArray(data)) throw Object.assign(new Error('Train route data not returned by provider'), { status: 502 });
  return data.map(train => ({
    trainNumber: first(train.train_no, train.trainNumber, train.trainNo),
    trainName: first(train.train_name, train.trainName, train.name),
    from: first(train.from_stn_name, train.source_stn_name, train.from),
    fromCode: first(train.from_stn_code, train.source_stn_code, train.fromCode),
    to: first(train.to_stn_name, train.dstn_stn_name, train.to),
    toCode: first(train.to_stn_code, train.dstn_stn_code, train.toCode),
    departure: first(train.from_time, train.departure),
    arrival: first(train.to_time, train.arrival),
    duration: first(train.travel_time, train.duration),
    distance: first(train.distance),
    runningDays: first(train.running_days, train.runningDays),
    classes: first(train.classes_of_travel, train.classes),
    type: first(train.train_type_name, train.type),
    nameHindi: first(train.train_name_hindi, train.nameHindi),
    halts: train.halts ?? null
  }));
}
function normalizeStations(payload) {
  const data = providerData(payload);
  const stations = Array.isArray(data?.stations) ? data.stations : (Array.isArray(data) ? data : null);
  if (!stations) throw Object.assign(new Error('Station suggestions not returned by provider'), { status: 502 });
  return stations.slice(0, 10).map(station => ({
    code: first(station.code, station.stationCode, station.station_code),
    name: first(station.name, station.stationName, station.station_name)
  })).filter(station => station.code && station.name);
}
function normalizeTrainsSearch(payload) {
  const data = providerData(payload);
  const list = Array.isArray(data?.trains) ? data.trains : (Array.isArray(data) ? data : []);
  return list.slice(0, 10).map(t => ({
    number: first(t.trainNo, t.trainNumber, t.number),
    name: first(t.trainName, t.name),
    type: first(t.trainType, t.type),
    days: first(t.daysOfRun, t.runningDays)
  })).filter(t => t.number && t.name);
}
function normalizeTrainRoute(payload) {
  const data = providerData(payload);
  if (!Array.isArray(data?.route)) throw Object.assign(new Error('Train stops not returned by provider'), { status: 502 });
  return data.route.map(station => ({
    code: first(station.stnCode, station.code, station.stationCode),
    name: first(station.stnName, station.name, station.stationName)
  })).filter(station => station.code && station.name);
}
function normalizeAvailability(payload) {
  const data = providerData(payload);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Seat availability data not returned by provider'), { status: 502 });
  const train = data.train || {};
  const fare = data.fare || {};
  const availability = Array.isArray(data.availability) ? data.availability : [];
  return {
    trainNumber: first(train.trainNo, train.train_no, train.number),
    trainName: first(train.trainName, train.train_name, train.name),
    from: first(train.fromStationName, train.from_stn_name, train.from),
    to: first(train.toStationName, train.to_stn_name, train.to),
    class: first(data.class, data.coach),
    quota: first(data.quota),
    fare: {
      base: fare.baseFare ?? null,
      reservation: fare.reservationCharge ?? fare.reservation ?? null,
      superfast: fare.superfastCharge ?? fare.superfast ?? null,
      total: fare.totalFare ?? fare.total ?? null
    },
    availability: availability.map(item => ({
      date: first(item.date),
      status: first(item.availabilityText, item.status, item.availability),
      prediction: first(item.prediction)
    }))
  };
}
function normalizeFare(payload) {
  const data = providerData(payload);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Fare data not returned by provider'), { status: 502 });
  return {
    trainNumber: first(data.trainNo, data.train_no, data.trainNumber),
    trainName: first(data.trainName, data.train_name, data.name),
    from: first(data.from),
    to: first(data.to),
    class: first(data.class),
    distance: data.distance ?? null,
    baseFare: data.baseFare ?? null,
    reservation: data.reservation ?? data.reservationCharge ?? null,
    superfast: data.superfast ?? data.superfastCharge ?? null,
    catering: data.catering ?? null,
    dynamicFare: data.dynamicFare ?? null,
    gst: data.gst ?? null,
    totalFare: data.totalFare ?? null,
    tatkalFare: data.tatkalFare ?? null,
    concession: data.concession ?? null
  };
}

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache' };
function sendJson(res, status, payload) { res.writeHead(status, jsonHeaders); res.end(JSON.stringify(payload)); }
function error(res, status, message) { sendJson(res, status, { success: false, message }); }
async function readBody(req) {
  let str = '';
  for await (const chunk of req) {
    str += chunk;
    if (str.length > 1024) throw Object.assign(new Error('Request body too large'), { status: 413 });
  }
  try { return JSON.parse(str || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON body'), { status: 400 }); }
}

export function createHandler({ apiKey = process.env.RAILKIT_API_KEY, apiUrl = process.env.RAILKIT_API_URL || PROVIDER_DEFAULT, fetchImpl = fetch, sdkImpl = null, trustProxy = process.env.TRUST_PROXY === 'true' } = {}) {
  const recent = new Map();
  const trainRoutes = new Map();
  const validKey = apiKey && apiKey !== 'PASTE_YOUR_OWN_RAILKIT_KEY_HERE';
  async function providerGet(route) {
    if (!validKey) throw Object.assign(new Error('RailKit API key जोड़ने के बाद ही लाइव स्टेटस मिलेगा।'), { status: 503 });

    if (sdkImpl || fetchImpl === fetch) {
      try {
        const sdk = sdkImpl || await import('railkit');
        sdk.configure(apiKey);
        const match = /^\/api\/v1\/pnr\/([^/]+)$/.exec(route);
        const trainMatch = /^\/api\/v1\/trains\/([^/]+)\/live\/([^/]+)$/.exec(route);
        if (match) {
          const result = await sdk.checkPNRStatus(match[1]);
          if (result?.success === false) {
            const providerMessage = String(result.error || '').trim();
            throw Object.assign(new Error(providerMessage || 'इस PNR का रेलवे रिकॉर्ड नहीं मिला।'), { status: 404 });
          }
          return result;
        }
        if (trainMatch) {
          const result = await sdk.trackTrain(trainMatch[1], trainMatch[2]);
          if (result?.success === false) throw Object.assign(new Error(result.error || 'Railway API से इस अनुरोध की जानकारी नहीं मिली।'), { status: 403 });
          return result;
        }
      } catch (e) {
        if (e?.status) throw e;
        throw Object.assign(new Error('Railway API से SDK संपर्क नहीं हो पाया।'), { status: 502 });
      }
    }

    let response;
    try {
      response = await fetchImpl(`${apiUrl.replace(/\/$/, '')}${route}`, { headers: { 'x-api-key': apiKey, Accept: 'application/json' }, signal: AbortSignal.timeout(13000) });
    } catch {
      throw Object.assign(new Error('Railway API से संपर्क नहीं हो पाया। इंटरनेट/सर्वर जाँचें।'), { status: 502 });
    }
    if (!response.ok) throw Object.assign(new Error(stripProviderError(response.status)), { status: response.status === 404 ? 404 : (response.status === 429 ? 429 : 502) });
    let obj;
    try { obj = await response.json(); } catch { throw Object.assign(new Error('रेलवे API ने गलत डेटा भेजा।'), { status: 502 }); }
    if (obj?.success === false) throw Object.assign(new Error('रेलवे API से इस अनुरोध की जानकारी नहीं मिली।'), { status: 502 });
    return obj;
  }
  async function providerCall(method, args) {
    if (!validKey) throw Object.assign(new Error('RailKit API key जोड़ने के बाद ही लाइव जानकारी मिलेगी।'), { status: 503 });
    if (sdkImpl || fetchImpl === fetch) {
      try {
        const sdk = sdkImpl || await import('railkit');
        sdk.configure(apiKey);
        const fn = sdk[method];
        if (typeof fn !== 'function') throw new Error(`RailKit SDK does not support ${method}`);
        const result = await fn(...args);
        if (result?.success === false) {
          throw Object.assign(new Error(String(result.error || 'Railway API से इस अनुरोध की जानकारी नहीं मिली।')), { status: 404 });
        }
        return result;
      } catch (e) {
        if (e?.status) throw e;
        throw Object.assign(new Error('Railway API से SDK संपर्क नहीं हो पाया।'), { status: 502 });
      }
    }
    throw Object.assign(new Error('इस सेवा के लिए RailKit SDK आवश्यक है।'), { status: 503 });
  }
  async function getTrainRoute(number) {
    if (trainRoutes.has(number)) return trainRoutes.get(number);
    const stations = normalizeTrainRoute(await providerCall('getTrainInfo', [number]));
    trainRoutes.set(number, stations);
    if (trainRoutes.size > 500) trainRoutes.delete(trainRoutes.keys().next().value);
    return stations;
  }
  function allowRequest(req) {
    const socketIp = req.socket.remoteAddress || 'unknown';
    const xff = req.headers['x-forwarded-for'];
    const ip = trustProxy && typeof xff === 'string' ? xff.split(',')[0].trim().slice(0, 64) : socketIp;
    const now = Date.now();
    const list = (recent.get(ip) || []).filter(t => t > now - 60_000);
    if (recent.size > 10000) recent.clear();
    if (list.length >= 12) { recent.set(ip, list); return false; }
    list.push(now); recent.set(ip, list); return true;
  }
  const handleRequest = async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    try {
      const requestUrl = new URL(req.url, 'http://localhost');
      const { pathname } = requestUrl;
      if (pathname === '/api/health') {
        if (req.method !== 'GET') return error(res, 405, 'Method not allowed');
        return sendJson(res, 200, { ready: Boolean(validKey), source: 'RailKit', message: validKey ? 'Server has an API key; live access not verified' : 'RailKit API key not configured' });
      }
      if (pathname === '/api/pnr') {
        if (req.method !== 'POST') return error(res, 405, 'Use POST /api/pnr');
        if (!allowRequest(req)) return error(res, 429, 'बहुत सारे अनुरोध किए गए। 1 मिनट बाद कोशिश करें।');
        const body = await readBody(req);
        const number = text(body?.number);
        if (!/^\d{10}$/.test(number)) return error(res, 400, 'PNR में ठीक 10 अंक होने चाहिए।');
        const result = normalizePNR(await providerGet(`/api/v1/pnr/${number}`), number);
        return sendJson(res, 200, { success: true, data: result });
      }
      if (pathname === '/api/train') {
        if (req.method !== 'GET') return error(res, 405, 'Method not allowed');
        if (!allowRequest(req)) return error(res, 429, 'बहुत सारे अनुरोध किए गए। 1 मिनट बाद कोशिश करें।');
        const number = requestUrl.searchParams.get('number') || '';
        const date = requestUrl.searchParams.get('date') || '';
        if (!/^\d{5}$/.test(number)) return error(res, 400, 'ट्रेन नंबर में ठीक 5 अंक होने चाहिए।');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(daysAgoInIndia(date)) || daysAgoInIndia(date) < 0 || daysAgoInIndia(date) > 5) {
          return error(res, 400, 'ट्रेन की प्रारंभ तारीख आज या पिछले 5 दिनों की चुनें (IST)।');
        }
        const result = normalizeTrain(await providerGet(`/api/v1/trains/${number}/live/${formatDateFromIso(date)}`), number, date);
        return sendJson(res, 200, { success: true, data: result });
      }
      if (pathname === '/api/stations') {
        if (req.method !== 'GET') return error(res, 405, 'Method not allowed');
        if (!allowRequest(req)) return error(res, 429, 'बहुत सारे अनुरोध किए गए। 1 मिनट बाद कोशिश करें।');
        const query = text(requestUrl.searchParams.get('q'));
        if (query.length < 2 || query.length > 50) return error(res, 400, 'स्टेशन खोजने के लिए कम से कम 2 अक्षर दर्ज करें।');
        const result = normalizeStations(await providerCall('stationsByName', [query]));
        return sendJson(res, 200, { success: true, data: { stations: result } });
      }
      if (pathname === '/api/trains') {
        if (req.method !== 'GET') return error(res, 405, 'Method not allowed');
        if (!allowRequest(req)) return error(res, 429, 'बहुत सारे अनुरोध किए गए। 1 मिनट बाद कोशिश करें।');
        const query = text(requestUrl.searchParams.get('q'));
        if (query.length < 2 || query.length > 50) return error(res, 400, 'ट्रेन खोजने के लिए कम से कम 2 अक्षर या अंक दर्ज करें।');
        const isNum = /^\d+$/.test(query);
        const result = normalizeTrainsSearch(await providerCall(isNum ? 'trainByNumber' : 'trainsByName', [query]));
        return sendJson(res, 200, { success: true, data: { trains: result } });
      }
      if (pathname === '/api/route') {
        if (req.method !== 'GET') return error(res, 405, 'Method not allowed');
        if (!allowRequest(req)) return error(res, 429, 'बहुत सारे अनुरोध किए गए। 1 मिनट बाद कोशिश करें।');
        const from = stationCode(requestUrl.searchParams.get('from'));
        const to = stationCode(requestUrl.searchParams.get('to'));
        const date = requestUrl.searchParams.get('date') || '';
        if (!/^[A-Z0-9]{1,5}$/.test(from) || !/^[A-Z0-9]{1,5}$/.test(to)) return error(res, 400, 'दोनों स्टेशन के सही स्टेशन कोड दर्ज करें।');
        if (from === to) return error(res, 400, 'शुरुआत और गंतव्य स्टेशन अलग होने चाहिए।');
        if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(daysAgoInIndia(date)) || daysAgoInIndia(date) > 0)) {
          return error(res, 400, 'रूट खोजने के लिए आज या आगे की सही तारीख चुनें।');
        }
        const sdkDate = date ? formatDateFromIso(date) : undefined;
        const result = normalizeRoute(await providerCall('searchTrainBetweenStations', [from, to, sdkDate]));
        return sendJson(res, 200, { success: true, data: result });
      }
      if (pathname === '/api/seats' || pathname === '/api/fare') {
        if (req.method !== 'GET') return error(res, 405, 'Method not allowed');
        if (!allowRequest(req)) return error(res, 429, 'बहुत सारे अनुरोध किए गए। 1 मिनट बाद कोशिश करें।');
        const number = requestUrl.searchParams.get('number') || '';
        const from = stationCode(requestUrl.searchParams.get('from'));
        const to = stationCode(requestUrl.searchParams.get('to'));
        const date = requestUrl.searchParams.get('date') || '';
        const travelClass = (requestUrl.searchParams.get('class') || '').toUpperCase();
        const quota = (requestUrl.searchParams.get('quota') || '').toUpperCase();
        const seatClasses = ['2S', 'SL', '3A', '3E', '2A', '1A', 'CC', 'EC'];
        const fareClasses = ['1A', '2A', '3A', '3E', 'CC', 'EC', 'EA', 'FC', 'SL', '2S', 'VS', 'CH', 'HS', 'VC', 'VA'];
        const quotas = pathname === '/api/seats' ? ['GN', 'LD', 'SS', 'TQ'] : ['GN', 'TQ', 'LD', 'DF', 'FT', 'LB', 'PT', 'YU', 'DP', 'HP', 'SS', 'PH'];
        if (!/^\d{5}$/.test(number)) return error(res, 400, 'ट्रेन नंबर में ठीक 5 अंक होने चाहिए।');
        if (!/^[A-Z0-9]{1,5}$/.test(from) || !/^[A-Z0-9]{1,5}$/.test(to) || from === to) return error(res, 400, 'अलग-अलग और सही स्टेशन कोड दर्ज करें।');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(daysAgoInIndia(date)) || daysAgoInIndia(date) > 0) {
          return error(res, 400, 'आज या आगे की सही यात्रा तारीख चुनें।');
        }
        if (!(pathname === '/api/seats' ? seatClasses : fareClasses).includes(travelClass)) return error(res, 400, 'सही यात्रा क्लास चुनें।');
        if (!quotas.includes(quota)) return error(res, 400, 'सही quota चुनें।');
        const sdkDate = formatDateFromIso(date);
        const method = pathname === '/api/seats' ? 'getAvailability' : 'fareLookup';
        let providerResult;
        try {
          providerResult = await providerCall(method, [number, from, to, sdkDate, travelClass, quota]);
        } catch (e) {
          if (pathname === '/api/seats') {
            const stations = await getTrainRoute(number);
            const fromIndex = stations.findIndex(station => station.code === from);
            const toIndex = stations.findIndex(station => station.code === to);
            if (fromIndex < 0 || toIndex < 0 || toIndex <= fromIndex) {
              return sendJson(res, 409, {
                success: false,
                message: 'यह ट्रेन चुने हुए station segment पर नहीं चलती। नीचे इस ट्रेन के वास्तविक stops में से सही station चुनें।',
                data: { stations }
              });
            }
          }
          throw e;
        }
        const data = pathname === '/api/seats' ? normalizeAvailability(providerResult) : normalizeFare(providerResult);
        return sendJson(res, 200, { success: true, data });
      }
      if (pathname.startsWith('/api/')) return error(res, 404, 'API endpoint नहीं मिला।');
      const staticDef = STATIC_FILES.get(pathname);
      if (!staticDef || req.method !== 'GET') return error(res, 404, 'Page not found');
      const [file, mime] = staticDef;
      const bytes = await readFile(path.join(SITE, file));
      res.writeHead(200, { 
        'Content-Type': mime, 
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Clear-Site-Data': '"cache", "storage"'
      });
      res.end(bytes);
    } catch (e) {
      const status = [400, 404, 413, 429, 503].includes(e.status) ? e.status : 502;
      error(res, status, e.message || 'Request failed');
    }
  };
   return handleRequest;
}
export function createApp(options) { return http.createServer(createHandler(options)); }
export default createApp;

// --- Start server when run directly (not imported as a module) ---
const isMain = !process.argv[1] || fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const PORT = Number(process.env.PORT) || 3000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚂 RailPlus server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}