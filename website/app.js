(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const config = window.RAIL_APP_CONFIG || {};
  const apiBase = (config.apiBaseUrl || '').replace(/\/$/, '');

  const tabs = {
    pnr: $('tab-pnr'),
    train: $('tab-train'),
    seats: $('tab-seats'),
    fare: $('tab-fare'),
    route: $('tab-route')
  };
  const panels = {
    pnr: $('panel-pnr'),
    train: $('panel-train'),
    seats: $('panel-seats'),
    fare: $('panel-fare'),
    route: $('panel-route')
  };

  // Utility functions
  const safe = (val) => String(val ?? '—').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const indiaISO = (date = new Date()) => {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  // Setup Date Constraints
  const todayIso = indiaISO();
  
  // Live Train running date (today to 5 days ago)
  const trainDateInput = $('journey-date');
  if (trainDateInput) {
    trainDateInput.value = todayIso;
    trainDateInput.max = todayIso;
    const minDate = new Date(`${todayIso}T00:00:00Z`);
    minDate.setUTCDate(minDate.getUTCDate() - 5);
    trainDateInput.min = minDate.toISOString().slice(0, 10);
  }

  // Seats, Fare, Route dates (today to 120 days ahead)
  const maxFuture = new Date(`${todayIso}T00:00:00Z`);
  maxFuture.setUTCDate(maxFuture.getUTCDate() + 120);
  const maxFutureIso = maxFuture.toISOString().slice(0, 10);

  ['seats-date-input', 'fare-date-input', 'route-date-input'].forEach(id => {
    const el = $(id);
    if (el) {
      el.value = todayIso;
      el.min = todayIso;
      el.max = maxFutureIso;
    }
  });

  // API Health Indicator
  if (apiBase) {
    fetch(`${apiBase}/api/health`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(health => {
        const connected = health?.ready;
        const ind = $('api-indicator');
        if (ind) {
          ind.classList.toggle('offline', !connected);
          const txt = ind.querySelector('.status-text');
          if (txt) {
            txt.textContent = connected ? 'सर्वर ऑनलाइन (API Active)' : 'डेमो मोड (Demo Mode)';
          }
        }
      })
      .catch(() => {
        const ind = $('api-indicator');
        if (ind) {
          ind.classList.add('offline');
          const txt = ind.querySelector('.status-text');
          if (txt) txt.textContent = 'सर्वर ऑफलाइन (Offline)';
        }
      });
  }

  // Tab Switching
  function switchTab(name) {
    Object.keys(tabs).forEach((n) => {
      const tabEl = tabs[n];
      const panelEl = panels[n];
      if (!tabEl || !panelEl) return;

      const isActive = n === name;
      tabEl.classList.toggle('active', isActive);
      tabEl.setAttribute('aria-selected', String(isActive));
      panelEl.hidden = !isActive;
      panelEl.classList.toggle('active', isActive);
    });

    hideFeedback();
    const res = $('result');
    if (res) res.hidden = true;
  }

  Object.keys(tabs).forEach(k => {
    tabs[k]?.addEventListener('click', () => switchTab(k));
  });

  // Input Formatting & Counter
  const pnrInput = $('pnr-input');
  const pnrCounter = $('pnr-counter');
  if (pnrInput) {
    pnrInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      if (pnrCounter) pnrCounter.textContent = `${e.target.value.length} / 10 अंक`;
    });
  }

  const trainInput = $('train-input');
  const trainCounter = $('train-counter');
  if (trainInput) {
    trainInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
      if (trainCounter) trainCounter.textContent = `${e.target.value.length} / 5`;
    });
  }

  // Quick Paste
  const pasteBtn = $('paste-pnr');
  if (pasteBtn && navigator.clipboard) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        const digits = text.replace(/\D/g, '').slice(0, 10);
        if (digits && pnrInput) {
          pnrInput.value = digits;
          if (pnrCounter) pnrCounter.textContent = `${digits.length} / 10 अंक`;
          pnrInput.focus();
        }
      } catch (_) {}
    });
  }

  // Quick Train Chips
  document.querySelectorAll('.quick-train-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const trainNo = btn.dataset.train;
      if (trainInput && trainNo) {
        trainInput.value = trainNo;
        if (trainCounter) trainCounter.textContent = `${trainNo.length} / 5`;
        trainInput.focus();
      }
    });
  });

  // Quick Route Chips
  document.querySelectorAll('.quick-route-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fromStn = btn.dataset.from;
      const toStn = btn.dataset.to;
      if ($('route-from-input') && fromStn) $('route-from-input').value = fromStn;
      if ($('route-to-input') && toStn) $('route-to-input').value = toStn;
    });
  });

  // User Notifications
  function notify(message, isError = true) {
    const el = $('feedback');
    if (!el) return;
    el.className = `status-alert${isError ? '' : ' success'}`;
    el.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${isError
          ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
          : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
        }
      </svg>
      <div>${message}</div>
    `;
    el.hidden = false;
  }

  function hideFeedback() {
    const el = $('feedback');
    if (el) el.hidden = true;
  }

  // Button Loading State
  function beginLoading(button) {
    if (!button) return () => {};
    button.disabled = true;
    button.classList.add('loading');
    return () => {
      button.disabled = false;
      button.classList.remove('loading');
    };
  }

  // API Call Handler
  async function fetchLive(endpoint, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: options.body ? 'POST' : 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!response.ok) {
        const issue = await response.json().catch(() => null);
        throw new Error(issue?.message || `सर्वर त्रुटि (${response.status})`);
      }

      const json = await response.json();
      if (!json || typeof json !== 'object' || json.success === false) {
        throw new Error(json?.message || 'गलत उत्तर प्राप्त हुआ');
      }

      return json.data && typeof json.data === 'object' && !Array.isArray(json.data) ? json.data : json;
    } finally {
      clearTimeout(timer);
    }
  }

  function showResult(html) {
    const res = $('result');
    if (!res) return;
    res.innerHTML = html;
    res.hidden = false;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const copyBtn = res.querySelector('.copy-pnr-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const pnrVal = copyBtn.dataset.pnr;
        if (pnrVal && navigator.clipboard) {
          navigator.clipboard.writeText(pnrVal).then(() => {
            const orgText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ कॉपी हो गया!';
            setTimeout(() => { copyBtn.innerHTML = orgText; }, 2000);
          });
        }
      });
    }
  }

  function getStatusClass(statusText = '') {
    const s = statusText.toUpperCase();
    if (s.includes('AVAILABLE') || s.includes('CNF') || s.includes('CONFIRM')) return 'cnf';
    if (s.includes('RAC')) return 'rac';
    return 'wl';
  }

  // ==========================================================================
  // 1. Render PNR Slip
  // ==========================================================================
  function renderPNR(data, demo = false) {
    saveRecent('pnr', data.pnr);

    const isChartPrepared = (data.chartStatus || '').toLowerCase().includes('prepared') &&
                            !(data.chartStatus || '').toLowerCase().includes('not');

    const passengers = Array.isArray(data.passengers) ? data.passengers : [];
    const rows = passengers.length > 0
      ? passengers.map((p, idx) => {
          const currentCls = getStatusClass(p.currentStatus);
          return `
            <tr>
              <td>यात्री ${idx + 1}</td>
              <td>${safe(p.bookingStatus)}</td>
              <td>
                <span class="status-badge-inline ${currentCls}">
                  ${safe(p.currentStatus)}
                </span>
              </td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="3" style="text-align:center;padding:16px;color:#64748b;">यात्री विवरण उपलब्ध नहीं है।</td></tr>';

    const html = `
      <div class="railway-ticket">
        <div class="ticket-topbar">
          <div class="ticket-train-header">
            <span class="train-num-tag">${safe(data.trainNumber)}</span>
            <span class="train-title">${safe(data.trainName)}</span>
          </div>
          <div>
            <span class="chart-tag ${isChartPrepared ? 'prepared' : 'not-prepared'}">
              ${isChartPrepared ? 'चार्ट तैयार है (Chart Prepared)' : 'चार्ट नहीं बना (Not Prepared)'}
            </span>
          </div>
        </div>

        <div class="ticket-route-row">
          <div class="station-point source">
            <span class="stn-label">प्रस्थान (From)</span>
            <span class="stn-name">${safe(data.from || 'Origin')}</span>
          </div>
          <div class="route-mid">
            <span class="route-arrow">➔</span>
            <span class="date-pill">यात्रा तिथि: <strong>${safe(data.journeyDate || '—')}</strong></span>
          </div>
          <div class="station-point destination">
            <span class="stn-label">गंतव्य (To)</span>
            <span class="stn-name">${safe(data.to || 'Destination')}</span>
          </div>
        </div>

        <div class="ticket-body">
          <div class="body-heading">
            <h3>यात्री आरक्षण स्थिति (Passenger Current Status)</h3>
            <button type="button" class="copy-pnr-btn" data-pnr="${safe(data.pnr)}" title="PNR कॉपी करें">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>PNR: ${safe(data.pnr)}</span>
            </button>
          </div>

          <table class="passenger-data-table">
            <thead>
              <tr>
                <th style="width: 25%;">यात्री क्रमांक</th>
                <th style="width: 40%;">बुकिंग स्टेटस (Booking)</th>
                <th style="width: 35%;">वर्तमान स्टेटस (Current)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div class="ticket-meta-footer">
          <div>
            ${demo
              ? '<strong style="color:#d97706;">[काल्पनिक डेटा / Demo Mode]</strong>'
              : `<span>अंतिम अपडेट: ${safe(data.lastUpdated || 'RailKit Gateway')}</span>`
            }
          </div>
          <div>
            <span>जांच: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // ==========================================================================
  // 2. Render Live Train Tracking
  // ==========================================================================
  function renderTrain(data, demo = false) {
    saveRecent('train', data.trainNumber);

    const isDelayed = (data.delayMinutes || 0) > 0;
    const stations = Array.isArray(data.stations) ? data.stations : [];
    const progressPct = Math.min(100, Math.max(0, Number(data.progressPercent) || 0));

    const stationRows = stations.map(s => {
      const isPassed = s.status === 'passed';
      const isCurrent = s.status === 'current';
      return `
        <div class="station-row ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}">
          <div class="station-pin"></div>
          <div class="station-text">
            <h4>
              <span>${safe(s.name)}</span>
              ${isCurrent ? '<span class="tag-current">वर्तमान स्टेशन</span>' : ''}
              ${s.platform ? `<span class="tag-platform">प्लेटफ़ॉर्म ${safe(s.platform)}</span>` : ''}
            </h4>
            <p>${isPassed ? 'निकल चुकी है' : isCurrent ? 'ट्रेन अभी इस स्टेशन पर है' : 'आगामी स्टेशन'}</p>
          </div>
          <div class="station-times">
            <span class="time-expected">${safe(s.expected || s.scheduled || '—')}</span>
            ${s.scheduled ? `<span class="time-scheduled">निर्धारित: ${safe(s.scheduled)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div class="train-live-card">
        <div class="live-card-header">
          <div class="live-train-info">
            <h2>${safe(data.trainNumber)} — ${safe(data.trainName)}</h2>
            <p>वर्तमान स्थिति: <strong>${safe(data.currentStation || 'मार्ग में')}</strong></p>
          </div>
          <div>
            <span class="delay-pill ${isDelayed ? 'delayed' : 'on-time'}">
              ${isDelayed ? `विलंब: ${data.delayMinutes} मिनट देरी से` : '✓ समय पर (Right Time)'}
            </span>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-labels">
            <span>सफ़र की प्रगति (Route Progress)</span>
            <span>${Math.round(progressPct)}% पूर्ण</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>

        <div class="timeline-scroll">
          ${stationRows || '<p style="padding:16px;color:#64748b;text-align:center;">स्टेशन सूची उपलब्ध नहीं है।</p>'}
        </div>

        <div class="ticket-meta-footer">
          <div>
            ${demo ? '<strong style="color:#d97706;">[डेमो रनिंग डेटा]</strong>' : '<span>स्रोत: NTES Gateway</span>'}
          </div>
          <div>
            <span>अपडेट: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // ==========================================================================
  // 3. Render Seat Availability Result
  // ==========================================================================
  function renderSeats(data, demo = false) {
    const list = Array.isArray(data.availability) ? data.availability : [];
    const rows = list.map(item => {
      const statusText = item.status || item.availabilityText || '—';
      const isAvail = statusText.toUpperCase().includes('AVAILABLE');
      const isRac = statusText.toUpperCase().includes('RAC');
      const badgeCls = isAvail ? 'available' : isRac ? 'rac' : 'waitlist';

      return `
        <tr>
          <td><strong>${safe(item.date)}</strong></td>
          <td>
            <span class="avail-badge ${badgeCls}">${safe(statusText)}</span>
          </td>
          <td>
            ${item.prediction ? `<span class="prediction-pill">संभावना: ${safe(item.prediction)}</span>` : '—'}
          </td>
          <td>
            ${data.fare?.total ? `₹${data.fare.total}` : '—'}
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <div class="seats-result-card">
        <div class="result-card-header">
          <div>
            <h2>${safe(data.trainNumber)} — ${safe(data.trainName)}</h2>
            <p>${safe(data.from)} ➔ ${safe(data.to)}</p>
          </div>
          <div>
            <span class="card-badge">सीट उपलब्धता (Seat Status)</span>
          </div>
        </div>

        <table class="avail-table">
          <thead>
            <tr>
              <th>यात्रा तिथि</th>
              <th>सीट स्थिति (Status)</th>
              <th>कन्फर्मेशन संभावना (Prediction)</th>
              <th>किराया (Fare)</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="4" style="text-align:center;padding:16px;">सीट जानकारी उपलब्ध नहीं है।</td></tr>'}
          </tbody>
        </table>

        <div class="ticket-meta-footer">
          <div>
            ${demo ? '<strong style="color:#d97706;">[काल्पनिक डेटा / Demo Mode]</strong>' : '<span>स्रोत: IRCTC Seat Availability Engine</span>'}
          </div>
          <div>
            <span>जांच: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // ==========================================================================
  // 4. Render Fare Breakdown Result
  // ==========================================================================
  function renderFare(data, demo = false) {
    const html = `
      <div class="fare-result-card">
        <div class="result-card-header">
          <div>
            <h2>${safe(data.trainNumber)} — ${safe(data.trainName)}</h2>
            <p>${safe(data.from)} ➔ ${safe(data.to)} | क्लास: <strong>${safe(data.class || '3A')}</strong></p>
          </div>
          <div>
            <span class="card-badge">किराया विवरण (Fare Breakdown)</span>
          </div>
        </div>

        <div class="fare-grid-layout">
          <div>
            <table class="fare-table">
              <thead>
                <tr>
                  <th>शुल्क घटक (Fare Component)</th>
                  <th style="text-align:right;">राशि (Amount)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>मूल किराया (Base Fare)</td><td style="text-align:right;">₹${safe(data.baseFare ?? '—')}</td></tr>
                <tr><td>आरक्षण शुल्क (Reservation Fee)</td><td style="text-align:right;">₹${safe(data.reservation ?? '—')}</td></tr>
                <tr><td>सुपरफास्ट शुल्क (Superfast Charge)</td><td style="text-align:right;">₹${safe(data.superfast ?? '0')}</td></tr>
                ${data.catering ? `<tr><td>खानपान शुल्क (Catering/Food)</td><td style="text-align:right;">₹${safe(data.catering)}</td></tr>` : ''}
                ${data.dynamicFare ? `<tr><td>डायनेमिक किराया (Dynamic Fare)</td><td style="text-align:right;">₹${safe(data.dynamicFare)}</td></tr>` : ''}
                <tr><td>वस्तु एवं सेवा कर (GST)</td><td style="text-align:right;">₹${safe(data.gst ?? '0')}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="fare-total-box">
            <span class="fare-total-label">कुल देय किराया (Total Fare)</span>
            <span class="fare-total-amount">₹${safe(data.totalFare ?? '—')}</span>
            <div class="fare-details-list">
              <div><span>दूरी (Distance):</span> <strong>${safe(data.distance ?? '—')} कि.मी.</strong></div>
              <div><span>क्लास (Class):</span> <strong>${safe(data.class ?? '3A')}</strong></div>
            </div>
          </div>
        </div>

        <div class="ticket-meta-footer">
          <div>
            ${demo ? '<strong style="color:#d97706;">[काल्पनिक किराया डेटा]</strong>' : '<span>स्रोत: Indian Railways PRS Fare System</span>'}
          </div>
          <div>
            <span>अंतिम जांच: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // ==========================================================================
  // 5. Render Route & Trains Between Stations Result
  // ==========================================================================
  function renderRoute(data, demo = false) {
    const trains = Array.isArray(data) ? data : (Array.isArray(data.trains) ? data.trains : []);
    const items = trains.map(t => `
      <div class="train-item-card">
        <div class="item-train-info">
          <h3>${safe(t.trainNumber)} — ${safe(t.trainName)}</h3>
          <p>${safe(t.fromCode || t.from)} ➔ ${safe(t.toCode || t.to)}</p>
        </div>

        <div class="item-schedule">
          <div class="schedule-point">
            <strong>${safe(t.departure)}</strong>
            <span>${safe(t.fromCode || t.from)}</span>
          </div>

          <div class="schedule-duration">
            <span>${safe(t.duration || '—')}</span>
          </div>

          <div class="schedule-point">
            <strong>${safe(t.arrival)}</strong>
            <span>${safe(t.toCode || t.to)}</span>
          </div>
        </div>

        <div class="item-actions">
          <span style="font-size:0.75rem;color:#64748b;">${safe(t.distance ? `${t.distance} कि.मी.` : '')} ${safe(t.halts ? `(${t.halts} ठहराव)` : '')}</span>
          <button type="button" class="btn-mini-action" onclick="document.getElementById('tab-seats').click();document.getElementById('seats-train-input').value='${safe(t.trainNumber)}';">
            सीट जांचें
          </button>
        </div>
      </div>
    `).join('');

    const html = `
      <div class="route-result-card">
        <div class="result-card-header">
          <div>
            <h2>ट्रेनों की सूची (Direct Trains Available)</h2>
            <p>कुल ट्रेनें: <strong>${trains.length}</strong></p>
          </div>
          <div>
            <span class="card-badge">ट्रेन रूट एवं समय-सारणी</span>
          </div>
        </div>

        <div class="route-trains-list">
          ${items || '<p style="padding:20px;text-align:center;color:#64748b;">इस रूट पर कोई डायरेक्ट ट्रेन नहीं मिली।</p>'}
        </div>

        <div class="ticket-meta-footer">
          <div>
            ${demo ? '<strong style="color:#d97706;">[काल्पनिक रूट डेटा]</strong>' : '<span>स्रोत: Indian Railways Timetable</span>'}
          </div>
          <div>
            <span>जांच: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // --- Recent Searches History ---
  function saveRecent(type, value) {
    if (!value) return;
    try {
      const key = `railplus_recent_${type}`;
      let items = JSON.parse(localStorage.getItem(key) || '[]');
      items = items.filter(i => i !== value);
      items.unshift(value);
      items = items.slice(0, 5);
      localStorage.setItem(key, JSON.stringify(items));
      loadRecent();
    } catch (_) {}
  }

  function loadRecent() {
    try {
      const pnrItems = JSON.parse(localStorage.getItem('railplus_recent_pnr') || '[]');
      const trainItems = JSON.parse(localStorage.getItem('railplus_recent_train') || '[]');
      const all = [
        ...pnrItems.map(p => ({ type: 'pnr', val: p })),
        ...trainItems.map(t => ({ type: 'train', val: t }))
      ].slice(0, 5);

      const container = $('recent-container');
      const list = $('recent-items');
      if (!container || !list) return;

      if (all.length === 0) {
        container.hidden = true;
        return;
      }

      list.innerHTML = all.map(item => `
        <span class="recent-chip" data-type="${item.type}" data-val="${item.val}">
          ${item.type === 'pnr' ? 'PNR' : 'ट्रेन'}: ${item.val}
        </span>
      `).join('');

      list.querySelectorAll('.recent-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const type = chip.dataset.type;
          const val = chip.dataset.val;
          if (type === 'pnr') {
            switchTab('pnr');
            if (pnrInput) {
              pnrInput.value = val;
              if (pnrCounter) pnrCounter.textContent = `${val.length} / 10 अंक`;
              $('pnr-form')?.dispatchEvent(new Event('submit'));
            }
          } else {
            switchTab('train');
            if (trainInput) {
              trainInput.value = val;
              if (trainCounter) trainCounter.textContent = `${val.length} / 5`;
              $('train-form')?.dispatchEvent(new Event('submit'));
            }
          }
        });
      });

      container.hidden = false;
    } catch (_) {}
  }

  $('clear-recent')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('railplus_recent_pnr');
      localStorage.removeItem('railplus_recent_train');
      const container = $('recent-container');
      if (container) container.hidden = true;
    } catch (_) {}
  });

  loadRecent();

  // ==========================================================================
  // Form Submit Listeners
  // ==========================================================================

  // Form 1: PNR
  $('pnr-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const pnr = (pnrInput?.value || '').trim();
    if (!/^\d{10}$/.test(pnr)) {
      notify('कृपया सही 10-अंकों का PNR नंबर दर्ज करें।');
      pnrInput?.focus();
      return;
    }

    const release = beginLoading($('btn-submit-pnr'));
    try {
      const data = await fetchLive('/api/pnr', { body: { number: pnr } });
      renderPNR(data);
    } catch (err) {
      notify(`PNR स्थिति प्राप्त नहीं हो सकी: ${err.message}.`);
    } finally {
      release();
    }
  });

  // Form 2: Live Train
  $('train-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const trainNum = (trainInput?.value || '').trim();
    const dateVal = trainDateInput?.value || '';

    if (!/^\d{5}$/.test(trainNum)) {
      notify('कृपया 5-अंकों का सही ट्रेन नंबर दर्ज करें (उदा. 12952)।');
      trainInput?.focus();
      return;
    }

    const release = beginLoading($('btn-submit-train'));
    try {
      const data = await fetchLive(`/api/train?number=${encodeURIComponent(trainNum)}&date=${encodeURIComponent(dateVal)}`);
      renderTrain(data);
    } catch (err) {
      notify(`ट्रेन स्थिति प्राप्त नहीं हो सकी: ${err.message}`);
    } finally {
      release();
    }
  });

  // Form 3: Seats Availability
  $('seats-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const number = ($('seats-train-input')?.value || '').trim();
    const from = ($('seats-from-input')?.value || '').trim().toUpperCase();
    const to = ($('seats-to-input')?.value || '').trim().toUpperCase();
    const date = $('seats-date-input')?.value || '';
    const cls = $('seats-class-select')?.value || '3A';
    const quota = $('seats-quota-select')?.value || 'GN';

    if (!/^\d{5}$/.test(number)) {
      notify('कृपया 5-अंकों का ट्रेन नंबर दर्ज करें।');
      return;
    }
    if (!from || !to || from === to) {
      notify('कृपया सही और अलग-अलग स्टेशन कोड दर्ज करें (उदा. NDLS और MMCT)।');
      return;
    }

    const release = beginLoading($('btn-submit-seats'));
    try {
      const data = await fetchLive(`/api/seats?number=${encodeURIComponent(number)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&class=${encodeURIComponent(cls)}&quota=${encodeURIComponent(quota)}`);
      renderSeats(data);
    } catch (err) {
      notify(`सीट उपलब्धता नहीं मिली: ${err.message}`);
    } finally {
      release();
    }
  });

  // Form 4: Fare
  $('fare-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const number = ($('fare-train-input')?.value || '').trim();
    const from = ($('fare-from-input')?.value || '').trim().toUpperCase();
    const to = ($('fare-to-input')?.value || '').trim().toUpperCase();
    const date = $('fare-date-input')?.value || '';
    const cls = $('fare-class-select')?.value || '3A';
    const quota = $('fare-quota-select')?.value || 'GN';

    if (!/^\d{5}$/.test(number)) {
      notify('कृपया 5-अंकों का ट्रेन नंबर दर्ज करें।');
      return;
    }
    if (!from || !to || from === to) {
      notify('कृपया सही स्टेशन कोड दर्ज करें।');
      return;
    }

    const release = beginLoading($('btn-submit-fare'));
    try {
      const data = await fetchLive(`/api/fare?number=${encodeURIComponent(number)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&class=${encodeURIComponent(cls)}&quota=${encodeURIComponent(quota)}`);
      renderFare(data);
    } catch (err) {
      notify(`किराया जानकारी नहीं मिली: ${err.message}`);
    } finally {
      release();
    }
  });

  // Form 5: Route
  $('route-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const from = ($('route-from-input')?.value || '').trim().toUpperCase();
    const to = ($('route-to-input')?.value || '').trim().toUpperCase();
    const date = $('route-date-input')?.value || '';

    if (!from || !to || from === to) {
      notify('कृपया शुरुआत और गंतव्य के सही स्टेशन कोड दर्ज करें।');
      return;
    }

    const release = beginLoading($('btn-submit-route'));
    try {
      const data = await fetchLive(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${date ? `&date=${encodeURIComponent(date)}` : ''}`);
      renderRoute(data);
    } catch (err) {
      notify(`रूट जानकारी नहीं मिली: ${err.message}`);
    } finally {
      release();
    }
  });

  // ==========================================================================
  // Demo Buttons
  // ==========================================================================
  $('demo-pnr')?.addEventListener('click', () => {
    hideFeedback();
    if (pnrInput) {
      pnrInput.value = '2451893620';
      if (pnrCounter) pnrCounter.textContent = '10 / 10 अंक';
    }
    renderPNR({
      pnr: '2451893620',
      trainNumber: '12952',
      trainName: 'नई दिल्ली - मुंबई राजधानी एक्सप्रेस (RAJDHANI EXP)',
      from: 'नई दिल्ली (NDLS)',
      to: 'मुंबई सेंट्रल (MMCT)',
      journeyDate: '24-नवंबर-2026',
      chartStatus: 'Chart Prepared',
      passengers: [
        { bookingStatus: 'B3, 42 (Lower)', currentStatus: 'CNF B3-42' },
        { bookingStatus: 'B3, 43 (Middle)', currentStatus: 'CNF B3-43' },
        { bookingStatus: 'WL 14', currentStatus: 'RAC 04' }
      ]
    }, true);
  });

  $('demo-train')?.addEventListener('click', () => {
    hideFeedback();
    if (trainInput) {
      trainInput.value = '12952';
      if (trainCounter) trainCounter.textContent = '5 / 5';
    }
    renderTrain({
      trainNumber: '12952',
      trainName: 'मुंबई राजधानी एक्सप्रेस (MUMBAI RAJDHANI)',
      currentStation: 'कोटा जंक्शन (KOTA)',
      delayMinutes: 0,
      progressPercent: 68,
      stations: [
        { name: 'नई दिल्ली (NDLS)', scheduled: '16:55', expected: '16:55', status: 'passed', platform: '3' },
        { name: 'मथुरा जंक्शन (MTJ)', scheduled: '18:53', expected: '18:55', status: 'passed', platform: '1' },
        { name: 'कोटा जंक्शन (KOTA)', scheduled: '21:30', expected: '21:30', status: 'current', platform: '2' },
        { name: 'रतलाम जंक्शन (RTM)', scheduled: '00:40', expected: '00:40', status: 'upcoming', platform: '4' },
        { name: 'वडोदरा जंक्शन (BRC)', scheduled: '03:45', expected: '03:45', status: 'upcoming', platform: '1' },
        { name: 'सूरत (ST)', scheduled: '05:15', expected: '05:15', status: 'upcoming', platform: '1' },
        { name: 'मुंबई सेंट्रल (MMCT)', scheduled: '08:35', expected: '08:35', status: 'upcoming', platform: '5' }
      ]
    }, true);
  });

  $('demo-seats')?.addEventListener('click', () => {
    hideFeedback();
    if ($('seats-train-input')) $('seats-train-input').value = '12952';
    if ($('seats-from-input')) $('seats-from-input').value = 'NDLS';
    if ($('seats-to-input')) $('seats-to-input').value = 'MMCT';
    renderSeats({
      trainNumber: '12952',
      trainName: 'MMCT TEJAS RAJDHANI',
      from: 'नई दिल्ली (NDLS)',
      to: 'मुंबई सेंट्रल (MMCT)',
      fare: { total: 3165 },
      availability: [
        { date: '25-नवंबर-2026', status: 'AVAILABLE 0038', prediction: '94% Chance' },
        { date: '26-नवंबर-2026', status: 'AVAILABLE 0012', prediction: '88% Chance' },
        { date: '27-नवंबर-2026', status: 'RAC 08', prediction: '76% Chance' },
        { date: '28-नवंबर-2026', status: 'WL 24', prediction: '52% Chance' }
      ]
    }, true);
  });

  $('demo-fare')?.addEventListener('click', () => {
    hideFeedback();
    if ($('fare-train-input')) $('fare-train-input').value = '12952';
    if ($('fare-from-input')) $('fare-from-input').value = 'NDLS';
    if ($('fare-to-input')) $('fare-to-input').value = 'MMCT';
    renderFare({
      trainNumber: '12952',
      trainName: 'MMCT TEJAS RAJDHANI',
      from: 'NDLS (नई दिल्ली)',
      to: 'MMCT (मुंबई सेंट्रल)',
      class: '3A (Third AC)',
      distance: 1384,
      baseFare: 1820,
      reservation: 40,
      superfast: 45,
      catering: 400,
      dynamicFare: 728,
      gst: 132,
      totalFare: 3165
    }, true);
  });

  $('demo-route')?.addEventListener('click', () => {
    hideFeedback();
    if ($('route-from-input')) $('route-from-input').value = 'NDLS';
    if ($('route-to-input')) $('route-to-input').value = 'MMCT';
    renderRoute([
      { trainNumber: '12952', trainName: 'TEJAS RAJDHANI EXP', fromCode: 'NDLS', toCode: 'MMCT', departure: '16:55', arrival: '08:35', duration: '15:40 hrs', distance: '1384', halts: 7 },
      { trainNumber: '12954', trainName: 'AUGUST KRANTI RAJ', fromCode: 'NZM', toCode: 'MMCT', departure: '17:15', arrival: '10:05', duration: '16:50 hrs', distance: '1377', halts: 11 },
      { trainNumber: '12904', trainName: 'GOLDEN TEMPLE MAIL', fromCode: 'NZM', toCode: 'BDTS', departure: '04:00', arrival: '23:55', duration: '19:55 hrs', distance: '1362', halts: 20 },
      { trainNumber: '12926', trainName: 'PASCHIM EXPRESS', fromCode: 'NDLS', toCode: 'BDTS', departure: '16:35', arrival: '14:55', duration: '22:20 hrs', distance: '1384', halts: 28 }
    ], true);
  });

  // Service Worker
  if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
