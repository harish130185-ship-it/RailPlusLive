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
  return {
    pnr: number,
    trainNumber: first(source.train?.number, source.trainNo, source.trainNumber),
    trainName: first(source.train?.name, source.trainName),
    from: stationName(details.source || source.source),
    to: stationName(details.destination || source.destination),
    journeyDate: first(details.date, details.journeyDate, source.journeyDate, source.date),
    chartStatus: first(source.chart?.status, source.chartStatus) || 'Not reported',
    passengers: passengers.map((person) => ({
      bookingStatus: first(person?.booking?.details, person?.booking?.status, person?.bookingStatus) || 'Not reported',
      currentStatus: first(person?.current?.details, person?.current?.status, person?.currentStatus) || 'Not reported'
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

export function createApp({ apiKey = process.env.RAILKIT_API_KEY, apiUrl = process.env.RAILKIT_API_URL || PROVIDER_DEFAULT, fetchImpl = fetch, sdkImpl = null, trustProxy = process.env.TRUST_PROXY === 'true' } = {}) {
  const recent = new Map();
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
  return http.createServer(async (req, res) => {
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
      if (pathname.startsWith('/api/')) return error(res, 404, 'API endpoint नहीं मिला।');
      const staticDef = STATIC_FILES.get(pathname);
      if (!staticDef || req.method !== 'GET') return error(res, 404, 'Page not found');
      const [file, mime] = staticDef;
      const bytes = await readFile(path.join(SITE, file));
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': file === 'config.js' || file === 'sw.js' || file === 'index.html' ? 'no-cache' : 'public, max-age=1800' });
      res.end(bytes);
    } catch (e) {
      const status = [400, 404, 413, 429, 503].includes(e.status) ? e.status : 502;
      error(res, status, e.message || 'Request failed');
    }
  });
}
export default createApp;