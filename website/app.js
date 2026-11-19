(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const config = window.RAIL_APP_CONFIG || {};
  const apiBase = (config.apiBaseUrl || '').replace(/\/$/, '');
  const tabs = { pnr: $('tab-pnr'), train: $('tab-train') };
  const panels = { pnr: $('panel-pnr'), train: $('panel-train') };
  let activeTab = 'pnr';

  const safe = (value) => String(value ?? '—').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const indiaISO = (date = new Date()) => {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const dayStart = indiaISO();
  $('journey-date').value = dayStart;
  $('journey-date').max = dayStart;
  const lastFive = new Date(`${dayStart}T00:00:00Z`);
  lastFive.setUTCDate(lastFive.getUTCDate() - 5);
  $('journey-date').min = lastFive.toISOString().slice(0, 10);
  if (apiBase) {
    fetch(`${apiBase}/api/health`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(health => {
      const connected = health?.ready;
      $('api-indicator').classList.toggle('connected', Boolean(connected));
      $('api-indicator').lastChild.textContent = connected ? 'API Key Configured' : 'API Key Required';
      $('connection-note').textContent = connected
        ? 'API Key सेट है। Live Status बटन से रेलवे provider से नई जानकारी ली जाएगी।'
        : 'लाइव जानकारी के लिए Railway API key जोड़ना जरूरी है। अभी डेमो और आधिकारिक लिंक उपलब्ध हैं।';
    }).catch(() => {
      $('api-indicator').lastChild.textContent = 'Server unavailable';
      $('connection-note').textContent = 'सर्वर उपलब्ध नहीं है। आधिकारिक रेलवे लिंक इस्तेमाल करें।';
    });
  } else {
    $('api-indicator').lastChild.textContent = 'Preview / Demo';
  }

  function switchTab(name) {
    activeTab = name;
    Object.keys(tabs).forEach((n) => {
      tabs[n].classList.toggle('active', n === name);
      tabs[n].setAttribute('aria-selected', String(n === name));
      tabs[n].tabIndex = n === name ? 0 : -1;
      panels[n].hidden = n !== name;
    });
    $('feedback').hidden = true;
    $('result').hidden = true;
  }

  tabs.pnr.addEventListener('click', () => switchTab('pnr'));
  tabs.train.addEventListener('click', () => switchTab('train'));
  Object.keys(tabs).forEach((name) => tabs[name].addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = name === 'pnr' ? 'train' : 'pnr';
    switchTab(next); tabs[next].focus();
  }));

  ['pnr-input','train-input'].forEach((id) => $(id).addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  }));

  function notify(message, error = true) {
    const el = $('feedback');
    el.className = `feedback${error ? ' error' : ''}`;
    el.textContent = message;
    el.hidden = false;
  }

  function beginLoading(button, label) {
    button.disabled = true;
    const original = button.firstElementChild.textContent;
    button.firstElementChild.textContent = label;
    return () => { button.disabled = false; button.firstElementChild.textContent = original; };
  }

  async function fetchLive(endpoint, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 13000);
    try {
      const response = await fetch(`${apiBase}${endpoint}`, { method: options.body ? 'POST' : 'GET', headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, ...(options.body ? { body: JSON.stringify(options.body) } : {}), signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (!response.ok) {
        const issue = await response.json().catch(() => null);
        throw new Error(issue?.message || `API error (${response.status})`);
      }
      const json = await response.json();
      if (!json || typeof json !== 'object' || json.success === false) throw new Error(json?.message || 'Invalid API response');
      return json.data && typeof json.data === 'object' && !Array.isArray(json.data) ? json.data : json;
    } finally { clearTimeout(timer); }
  }

  function showResult(html) {
    $('result').innerHTML = html;
    $('result').hidden = false;
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resultTitle(title, demo) {
    return `<div class="result-title-row"><h2>${safe(title)}</h2><span class="${demo ? 'sample-flag' : 'live-flag'}">${demo ? 'DEMO / काल्पनिक डेटा' : 'API response · Verify with Railways'}</span></div>`;
  }

  const tile = (label, value) => `<div class="detail-tile"><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`;

  function renderPNR(data, demo = false) {
    const passengers = Array.isArray(data.passengers) ? data.passengers : [];
    const rows = passengers.length ? passengers.map((p, i) => `<tr><td>Passenger ${i + 1}</td><td>${safe(p.bookingStatus)}</td><td>${safe(p.currentStatus)}</td></tr>`).join('') : '<tr><td colspan="3">Passenger data unavailable</td></tr>';
    showResult(`${resultTitle('PNR Enquiry Result', demo)}
      <div class="trip-head"><div><strong>${safe(data.trainNumber)} · ${safe(data.trainName)}</strong><small>PNR: ${safe(data.pnr)}</small></div><span class="status-badge">${safe(data.chartStatus || 'Chart status unknown')}</span></div>
      <div class="details-grid">${tile('From', data.from)}${tile('To', data.to)}${tile('Journey date', data.journeyDate)}${demo ? '' : tile('Checked at', data.checkedAt ? new Date(data.checkedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : '—')}</div>
      <h3 class="section-subhead">Passenger Status</h3>
      <table class="passenger-table"><thead><tr><th>Passenger</th><th>Booking Status</th><th>Current Status</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="result-disclaimer">${demo ? 'यह सिर्फ़ UI दिखाने के लिए बनाई गई काल्पनिक जानकारी है। इसे असली PNR status न मानें।' : 'स्थिति बदल सकती है। यात्रा से पहले रेलवे के आधिकारिक पोर्टल पर पुष्टि करें।'}</p>`);
  }

  function renderTrain(data, demo = false) {
    const stations = Array.isArray(data.stations) ? data.stations : [];
    const rows = stations.map((s) => {
      const state = ['passed','current'].includes(s.status) ? s.status : '';
      return `<div class="stop ${state}"><span class="stop-dot" aria-hidden="true"></span><div><strong>${safe(s.name)}</strong><p>${safe(s.status === 'passed' ? 'Departed' : s.status === 'current' ? 'Current / last reported station' : 'Upcoming')} ${s.platform ? `· Platform ${safe(s.platform)}` : ''}</p></div><div class="stop-time">${safe(s.expected || s.scheduled)}<small>${s.scheduled ? `Scheduled ${safe(s.scheduled)}` : ''}</small></div></div>`;
    }).join('');
    showResult(`${resultTitle('Train Running Result', demo)}
      <div class="trip-head"><div><strong>${safe(data.trainNumber)} · ${safe(data.trainName)}</strong><small>Journey start: ${safe(data.journeyDate)}</small></div><span class="status-badge">${safe(data.runningStatus || 'Status unknown')}</span></div>
      <div class="details-grid">${tile('Reported delay', data.delayMinutes != null ? `${data.delayMinutes} min` : 'Not provided')}${tile('Railway last update', data.lastUpdated || 'Not provided')}${tile('Current / last station', data.currentStation || 'Not reported')}${tile('Stations shown', stations.length)}</div>
      ${data.progressPercent != null ? `<div class="progress-box"><div><strong>Route progress</strong><span>${safe(Math.round(data.progressPercent))}%</span></div><div class="progress-track"><span style="width:${Math.min(100, Math.max(0, Number(data.progressPercent) || 0))}%"></span></div></div>` : ''}
      <h3 class="section-subhead">Station Timeline</h3><div class="timeline">${rows || '<p>No station updates available.</p>'}</div>
      <p class="result-disclaimer">${demo ? 'यह स्टेशन टाइमलाइन काल्पनिक है; वास्तविक ट्रेन की लोकेशन या देरी नहीं दिखाती।' : 'डेटा की ताजगी आपके API provider पर निर्भर है। आधिकारिक NTES से भी सत्यापित करें।'}</p>`);
  }

  $('pnr-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('feedback').hidden = true;
    $('result').hidden = true;
    const pnr = $('pnr-input').value.trim();
    if (!/^\d{10}$/.test(pnr)) { notify('कृपया सही 10 अंकों का PNR नंबर दर्ज करें।'); return; }
    if (!apiBase) { notify('Live PNR API अभी जुड़ी नहीं है। आप नीचे दिए गए Official PNR website लिंक से असली स्टेटस देख सकते हैं, या डेमो रिज़ल्ट खोल सकते हैं।'); return; }
    const release = beginLoading(event.submitter || $('pnr-form').querySelector('button[type=submit]'), 'Checking PNR…');
    try { renderPNR(await fetchLive('/api/pnr', {body:{number:pnr}})); }
    catch (error) { notify(`लाइव PNR जानकारी नहीं मिली: ${error.message}. कृपया official site से जाँचें।`); }
    finally { release(); }
  });

  $('train-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('feedback').hidden = true;
    $('result').hidden = true;
    const num = $('train-input').value.trim();
    const date = $('journey-date').value;
    if (!/^\d{5}$/.test(num)) { notify('कृपया सही 5 अंकों का ट्रेन नंबर दर्ज करें।'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < $('journey-date').min || date > $('journey-date').max) { notify('ट्रेन की प्रारंभ तारीख आज या पिछले 5 दिनों की चुनें।'); return; }
    if (!apiBase) { notify('Live Train Status API अभी जुड़ी नहीं है। वास्तविक जानकारी के लिए नीचे Official NTES website लिंक खोलें, या डेमो रिज़ल्ट देखें।'); return; }
    const release = beginLoading(event.submitter || $('train-form').querySelector('button[type=submit]'), 'Checking train…');
    try { renderTrain(await fetchLive(`/api/train?number=${encodeURIComponent(num)}&date=${encodeURIComponent(date)}`)); }
    catch (error) { notify(`लाइव ट्रेन जानकारी नहीं मिली: ${error.message}. कृपया official NTES से जाँचें।`); }
    finally { release(); }
  });

  $('demo-pnr').addEventListener('click', () => {
    $('feedback').hidden = true;
    $('pnr-input').value = '1234567890';
    renderPNR({pnr:'1234567890',trainNumber:'00001',trainName:'DEMO EXPRESS',from:'Sample Station A',to:'Sample Station B',journeyDate:'2026-12-15',chartStatus:'Not Prepared',passengers:[{bookingStatus:'WL/21',currentStatus:'RAC/04'}]}, true);
  });
  $('demo-train').addEventListener('click', () => {
    $('feedback').hidden = true;
    $('train-input').value = '00001';
    renderTrain({trainNumber:'00001',trainName:'DEMO EXPRESS',journeyDate:'2026-12-15',runningStatus:'8 min late · DEMO',delayMinutes:8,lastUpdated:'Sample timestamp',stations:[{name:'Sample Station A',scheduled:'08:00',expected:'08:00',status:'passed',platform:'1'},{name:'Sample Station B',scheduled:'09:30',expected:'09:38',status:'current',platform:'2'},{name:'Sample Station C',scheduled:'11:10',expected:'11:18',status:'upcoming',platform:'3'},{name:'Sample Station D',scheduled:'13:30',expected:'13:38',status:'upcoming',platform:'1'}]}, true);
  });

  if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
