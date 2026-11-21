import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const EVENTS_FILE = path.join(DATA_DIR, 'analytics-events.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory store initialized from disk
let events = [];
try {
  if (fs.existsSync(EVENTS_FILE)) {
    const raw = fs.readFileSync(EVENTS_FILE, 'utf8');
    events = JSON.parse(raw);
    if (!Array.isArray(events)) events = [];
  }
} catch {
  events = [];
}

let saveTimeout = null;
function persistEvents() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      // Keep up to 50,000 recent events to prevent unbounded growth
      if (events.length > 50000) {
        events = events.slice(-50000);
      }
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(events), 'utf8');
    } catch (e) {
      console.error('[Analytics] Failed to persist analytics events:', e.message);
    }
  }, 1000);
}

// Helper: Get IST date string (YYYY-MM-DD)
function getIndiaDateStr(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

// Helper: Get IST month string (YYYY-MM)
function getIndiaMonthStr(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${m.year}-${m.month}`;
}

// Recent deduplication cache: key = `${visitorId}:${page}` -> timestamp
const recentPageviews = new Map();

/**
 * Record a pageview or action event
 */
export function recordEvent({ visitorId, sessionId, page, device, isReturning, referrer, userAgent }) {
  if (!visitorId) return { recorded: false, reason: 'missing_visitor_id' };

  const now = Date.now();
  const dedupKey = `${visitorId}:${page}`;
  const lastSeen = recentPageviews.get(dedupKey);

  // De-duplicate if exact same page was viewed within last 3 seconds (e.g. rapid PWA tab tap or re-render)
  if (lastSeen && (now - lastSeen < 3000)) {
    return { recorded: false, reason: 'deduplicated' };
  }

  recentPageviews.set(dedupKey, now);
  if (recentPageviews.size > 20000) {
    // Evict old entries
    const cutoff = now - 60000;
    for (const [k, ts] of recentPageviews.entries()) {
      if (ts < cutoff) recentPageviews.delete(k);
    }
  }

  // Normalize device
  let normalizedDevice = 'desktop';
  const ua = (userAgent || '').toLowerCase();
  if (device === 'mobile' || /mobile|android|iphone|ipod/i.test(ua)) {
    normalizedDevice = 'mobile';
  } else if (device === 'tablet' || /ipad|tablet/i.test(ua)) {
    normalizedDevice = 'tablet';
  }

  const evt = {
    id: 'evt_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    visitorId: String(visitorId).slice(0, 64),
    sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
    page: String(page || '/').slice(0, 100),
    device: normalizedDevice,
    isReturning: Boolean(isReturning),
    referrer: referrer ? String(referrer).slice(0, 120) : 'direct',
    date: getIndiaDateStr(new Date(now)),
    month: getIndiaMonthStr(new Date(now)),
    ts: now
  };

  events.push(evt);
  persistEvents();

  return { recorded: true, id: evt.id };
}

/**
 * Compute real aggregate analytics
 */
export function getAnalyticsSummary() {
  const now = new Date();
  const todayStr = getIndiaDateStr(now);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getIndiaDateStr(yesterday);

  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const totalVisitorsSet = new Set();
  const todayVisitorsSet = new Set();
  const yesterdayVisitorsSet = new Set();
  const last7DaysVisitorsSet = new Set();
  const last30DaysVisitorsSet = new Set();
  const returningVisitorsSet = new Set();

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  const pageCounts = {};
  const dailyBuckets = {}; // date -> { visitors: Set, views: count }
  const monthlyBuckets = {}; // month -> { visitors: Set, views: count }

  for (const evt of events) {
    totalVisitorsSet.add(evt.visitorId);

    if (evt.date === todayStr) {
      todayVisitorsSet.add(evt.visitorId);
    }
    if (evt.date === yesterdayStr) {
      yesterdayVisitorsSet.add(evt.visitorId);
    }
    if (evt.ts >= sevenDaysAgo) {
      last7DaysVisitorsSet.add(evt.visitorId);
    }
    if (evt.ts >= thirtyDaysAgo) {
      last30DaysVisitorsSet.add(evt.visitorId);
    }
    if (evt.isReturning) {
      returningVisitorsSet.add(evt.visitorId);
    }

    // Device breakdown
    if (deviceCounts[evt.device] !== undefined) {
      deviceCounts[evt.device]++;
    } else {
      deviceCounts.desktop++;
    }

    // Page counts
    const pageKey = evt.page || '/';
    pageCounts[pageKey] = (pageCounts[pageKey] || 0) + 1;

    // Daily buckets (last 14 days)
    if (!dailyBuckets[evt.date]) {
      dailyBuckets[evt.date] = { date: evt.date, visitors: new Set(), pageViews: 0 };
    }
    dailyBuckets[evt.date].visitors.add(evt.visitorId);
    dailyBuckets[evt.date].pageViews++;

    // Monthly buckets
    if (!monthlyBuckets[evt.month]) {
      monthlyBuckets[evt.month] = { month: evt.month, visitors: new Set(), pageViews: 0 };
    }
    monthlyBuckets[evt.month].visitors.add(evt.visitorId);
    monthlyBuckets[evt.month].pageViews++;
  }

  // Format top pages
  const totalViews = events.length;
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([page, views]) => ({
      page,
      views,
      percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0
    }));

  // Format daily trends (sorted chronologically, last 14 days)
  const dailyTrends = Object.values(dailyBuckets)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(b => ({
      date: b.date,
      uniqueVisitors: b.visitors.size,
      pageViews: b.pageViews
    }));

  // Format monthly trends
  const monthlyTrends = Object.values(monthlyBuckets)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(b => ({
      month: b.month,
      uniqueVisitors: b.visitors.size,
      pageViews: b.pageViews
    }));

  const totalDeviceViews = (deviceCounts.mobile + deviceCounts.desktop + deviceCounts.tablet) || 1;
  const devicePercentages = {
    mobile: Math.round((deviceCounts.mobile / totalDeviceViews) * 100),
    desktop: Math.round((deviceCounts.desktop / totalDeviceViews) * 100),
    tablet: Math.round((deviceCounts.tablet / totalDeviceViews) * 100)
  };

  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';

  return {
    success: true,
    data: {
      metrics: {
        totalUniqueVisitors: totalVisitorsSet.size,
        todayVisitors: todayVisitorsSet.size,
        yesterdayVisitors: yesterdayVisitorsSet.size,
        last7DaysVisitors: last7DaysVisitorsSet.size,
        last30DaysVisitors: last30DaysVisitorsSet.size,
        totalPageViews: totalViews,
        returningVisitorsCount: returningVisitorsSet.size,
        returningPercentage: totalVisitorsSet.size > 0 
          ? Math.round((returningVisitorsSet.size / totalVisitorsSet.size) * 100) 
          : 0
      },
      devices: {
        counts: deviceCounts,
        percentages: devicePercentages
      },
      topPages,
      dailyTrends,
      monthlyTrends,
      provider: {
        name: 'RailPlus First-Party Privacy-Conscious Analytics',
        ga4Configured: Boolean(ga4Id),
        ga4MeasurementId: ga4Id ? `${ga4Id.slice(0, 3)}***${ga4Id.slice(-3)}` : null
      },
      lastUpdated: new Date().toISOString()
    }
  };
}

export function clearAnalyticsData() {
  events = [];
  try {
    if (fs.existsSync(EVENTS_FILE)) fs.unlinkSync(EVENTS_FILE);
  } catch {}
  return { success: true, message: 'All analytics events cleared.' };
}
