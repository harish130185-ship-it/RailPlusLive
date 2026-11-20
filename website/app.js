(() => {
  'use strict';
  
  const $ = (id) => document.getElementById(id);
  const config = window.RAIL_APP_CONFIG || {};
  const apiBase = (config.apiBaseUrl || '').replace(/\/$/, '');
  
  const tabs = { pnr: $('tab-pnr'), train: $('tab-train') };
  const panels = { pnr: $('panel-pnr'), train: $('panel-train') };
  let activeTab = 'pnr';

  // --- Utility functions ---
  const safe = (val) => String(val ?? '—').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const indiaISO = (date = new Date()) => {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  // Setup Date Constraints (today to 5 days ago)
  const todayIso = indiaISO();
  const dateInput = $('journey-date');
  if (dateInput) {
    dateInput.value = todayIso;
    dateInput.max = todayIso;
    const minDate = new Date(`${todayIso}T00:00:00Z`);
    minDate.setUTCDate(minDate.getUTCDate() - 5);
    dateInput.min = minDate.toISOString().slice(0, 10);
  }

  // --- API Health Indicator ---
  if (apiBase) {
    fetch(`${apiBase}/api/health`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(health => {
        const connected = health?.ready;
        const ind = $('api-indicator');
        if (ind) {
          ind.classList.toggle('connected', Boolean(connected));
          const label = ind.querySelector('.status-label') || ind;
          label.textContent = connected ? 'Live API Connected' : 'Demo Mode (Key Required)';
        }
      })
      .catch(() => {
        const ind = $('api-indicator');
        if (ind) {
          const label = ind.querySelector('.status-label') || ind;
          label.textContent = 'Server Offline';
        }
      });
  }

  // --- Tab Switching Logic ---
  function switchTab(name) {
    activeTab = name;
    Object.keys(tabs).forEach((n) => {
      const tabEl = tabs[n];
      const panelEl = panels[n];
      if (!tabEl || !panelEl) return;
      
      const isActive = n === name;
      tabEl.classList.toggle('active', isActive);
      tabEl.setAttribute('aria-selected', String(isActive));
      panelEl.hidden = !isActive;
    });
    
    hideFeedback();
    const resultSec = $('result');
    if (resultSec) resultSec.hidden = true;
  }

  tabs.pnr?.addEventListener('click', () => switchTab('pnr'));
  tabs.train?.addEventListener('click', () => switchTab('train'));

  // --- Input formatting & Character counters ---
  const pnrInput = $('pnr-input');
  const pnrCounter = $('pnr-counter');
  if (pnrInput) {
    pnrInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      if (pnrCounter) pnrCounter.textContent = `${e.target.value.length}/10`;
    });
  }

  const trainInput = $('train-input');
  const trainCounter = $('train-counter');
  if (trainInput) {
    trainInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
      if (trainCounter) trainCounter.textContent = `${e.target.value.length}/5`;
    });
  }

  // Quick Paste Button
  const pasteBtn = $('paste-pnr');
  if (pasteBtn && navigator.clipboard) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        const digits = text.replace(/\D/g, '').slice(0, 10);
        if (digits && pnrInput) {
          pnrInput.value = digits;
          if (pnrCounter) pnrCounter.textContent = `${digits.length}/10`;
          pnrInput.focus();
        }
      } catch (err) {
        console.warn('Clipboard read failed:', err);
      }
    });
  }

  // Quick Popular Train Chips
  document.querySelectorAll('.train-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const trainNo = btn.dataset.train;
      if (trainInput && trainNo) {
        trainInput.value = trainNo;
        if (trainCounter) trainCounter.textContent = `${trainNo.length}/5`;
        trainInput.focus();
      }
    });
  });

  // --- Feedback / Notification System ---
  function notify(message, isError = true) {
    const el = $('feedback');
    if (!el) return;
    el.className = `feedback-banner${isError ? ' error' : ' success'}`;
    el.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  // --- Loading Button State ---
  function beginLoading(button) {
    if (!button) return () => {};
    button.disabled = true;
    button.classList.add('loading');
    return () => {
      button.disabled = false;
      button.classList.remove('loading');
    };
  }

  // --- API Fetch Wrapper ---
  async function fetchLive(endpoint, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: options.body ? 'POST' : 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      });

      if (!response.ok) {
        const issue = await response.json().catch(() => null);
        throw new Error(issue?.message || `API error (${response.status})`);
      }

      const json = await response.json();
      if (!json || typeof json !== 'object' || json.success === false) {
        throw new Error(json?.message || 'Invalid API response format');
      }

      return json.data && typeof json.data === 'object' && !Array.isArray(json.data) ? json.data : json;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Show Results View ---
  function showResult(html) {
    const res = $('result');
    if (!res) return;
    res.innerHTML = html;
    res.hidden = false;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Setup Copy PNR Button if present
    const copyBtn = res.querySelector('.pnr-tag-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const pnrVal = copyBtn.dataset.pnr;
        if (pnrVal && navigator.clipboard) {
          navigator.clipboard.writeText(pnrVal).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Copied!';
            setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
          });
        }
      });
    }
  }

  // Helper to categorize passenger status (CNF, RAC, WL)
  function getStatusClass(statusText = '') {
    const s = statusText.toUpperCase();
    if (s.includes('CNF') || s.includes('CONFIRM')) return 'cnf';
    if (s.includes('RAC')) return 'rac';
    return 'wl';
  }

  // --- Render PNR Result (Boarding Pass / Digital Ticket Style) ---
  function renderPNR(data, demo = false) {
    saveRecent('pnr', data.pnr);

    const isChartPrepared = (data.chartStatus || '').toLowerCase().includes('prepared') && 
                            !(data.chartStatus || '').toLowerCase().includes('not');

    const passengers = Array.isArray(data.passengers) ? data.passengers : [];
    const passengerCards = passengers.length > 0 
      ? passengers.map((p, idx) => {
          const currentCls = getStatusClass(p.currentStatus);
          return `
            <div class="passenger-box">
              <div class="passenger-box-top">
                <span class="passenger-number">Passenger ${idx + 1}</span>
                <span class="status-pill-small ${currentCls}">${safe(p.currentStatus)}</span>
              </div>
              <div class="passenger-status-row">
                <div class="status-cell">
                  <span>Booking</span>
                  <strong>${safe(p.bookingStatus)}</strong>
                </div>
                <div class="status-cell">
                  <span>Current</span>
                  <strong>${safe(p.currentStatus)}</strong>
                </div>
              </div>
            </div>
          `;
        }).join('')
      : '<p style="color:var(--text-muted);font-size:0.9rem;">यात्री सूची उपलब्ध नहीं है।</p>';

    const html = `
      <div class="ticket-card">
        <!-- Ticket Header -->
        <div class="ticket-header">
          <div class="ticket-train-info">
            <span class="train-badge-pill">${safe(data.trainNumber)}</span>
            <div class="ticket-train-name">
              <h2>${safe(data.trainName)}</h2>
              <span>Indian Railways Express</span>
            </div>
          </div>
          <div class="ticket-chart-status">
            <span class="badge-chart ${isChartPrepared ? 'prepared' : 'not-prepared'}">
              ${isChartPrepared ? '● Chart Prepared' : '○ Chart Not Prepared'}
            </span>
          </div>
        </div>

        <!-- Route Strip (From -> To) -->
        <div class="route-strip">
          <div class="route-station orig">
            <span class="station-city">${safe(data.from || 'Origin')}</span>
            <span class="station-label">Source Station</span>
          </div>

          <div class="route-connector">
            <div class="route-line">
              <div class="route-dot start"></div>
              <div class="route-train-icon">➔</div>
              <div class="route-dot end"></div>
            </div>
            <span class="journey-date-tag">Date: ${safe(data.journeyDate || '—')}</span>
          </div>

          <div class="route-station dest">
            <span class="station-city">${safe(data.to || 'Destination')}</span>
            <span class="station-label">Destination Station</span>
          </div>
        </div>

        <!-- Passengers Status Grid -->
        <div class="passengers-section">
          <div class="section-head">
            <h3>Passenger Berth & Coach Status</h3>
            <button type="button" class="pnr-tag-copy" data-pnr="${safe(data.pnr)}" title="Click to copy PNR">
              <span>PNR: ${safe(data.pnr)}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div class="passengers-grid">
            ${passengerCards}
          </div>
        </div>

        <!-- Ticket Footer Meta -->
        <div class="ticket-footer">
          <div>
            ${demo 
              ? '<span style="color:#f59e0b;font-weight:700;">⚠️ DEMO DATA</span> (काल्पनिक डेटा — परीक्षण के लिए)' 
              : `<span>अंतिम अपडेट: ${safe(data.lastUpdated || 'RailKit Live Gateway')}</span>`
            }
          </div>
          <div>
            <span>Checked: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // --- Render Live Train Tracking Result ---
  function renderTrain(data, demo = false) {
    saveRecent('train', data.trainNumber);

    const isDelayed = (data.delayMinutes || 0) > 0;
    const stations = Array.isArray(data.stations) ? data.stations : [];
    const progressPct = Math.min(100, Math.max(0, Number(data.progressPercent) || 0));

    const stationRows = stations.map(s => {
      const isPassed = s.status === 'passed';
      const isCurrent = s.status === 'current';
      return `
        <div class="timeline-station ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}">
          <div class="station-node"></div>
          <div class="station-details">
            <h4>
              <span>${safe(s.name)}</span>
              ${isCurrent ? '<span class="current-pill">Current</span>' : ''}
              ${s.platform ? `<span class="platform-pill">PF ${safe(s.platform)}</span>` : ''}
            </h4>
            <p>${isPassed ? 'Passed' : isCurrent ? 'Train is at this station' : 'Upcoming'}</p>
          </div>
          <div class="station-timing">
            <span class="timing-actual">${safe(s.expected || s.scheduled || '—')}</span>
            ${s.scheduled ? `<span class="timing-scheduled">Sch: ${safe(s.scheduled)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div class="live-tracker-card">
        <!-- Tracker Header -->
        <div class="tracker-header">
          <div class="tracker-status-box">
            <div class="radar-dot"></div>
            <div class="tracker-headline">
              <h2>${safe(data.trainNumber)} — ${safe(data.trainName)}</h2>
              <p>Current: <strong>${safe(data.currentStation || 'Station En Route')}</strong></p>
            </div>
          </div>
          <div>
            <span class="delay-badge ${isDelayed ? 'late' : 'on-time'}">
              ${isDelayed ? `⚠️ Late by ${data.delayMinutes} min` : '✓ Right Time / On Schedule'}
            </span>
          </div>
        </div>

        <!-- Route Progress Bar -->
        <div class="route-progress-bar">
          <div class="progress-info">
            <span>Route Journey Progress</span>
            <span>${Math.round(progressPct)}% Completed</span>
          </div>
          <div class="progress-track-bg">
            <div class="progress-track-fill" style="width: ${progressPct}%"></div>
          </div>
        </div>

        <!-- Station Timeline List -->
        <div class="timeline-section">
          <div class="timeline-list">
            ${stationRows || '<p style="padding:16px;color:var(--text-muted);">स्टेशन टाइमलाइन उपलब्ध नहीं है।</p>'}
          </div>
        </div>

        <!-- Footer Meta -->
        <div class="ticket-footer">
          <div>
            ${demo ? '<span style="color:#f59e0b;font-weight:700;">⚠️ DEMO RUN</span> (काल्पनिक ट्रेन रनिंग डेटा)' : `<span>स्रोत: RailKit Live GPS Tracking</span>`}
          </div>
          <div>
            <span>Checked: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);
  }

  // --- Recent Searches History (LocalStorage) ---
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
        <span class="recent-pill" data-type="${item.type}" data-val="${item.val}">
          ${item.type === 'pnr' ? '🎟️' : '🚆'} ${item.val}
        </span>
      `).join('');

      list.querySelectorAll('.recent-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const type = pill.dataset.type;
          const val = pill.dataset.val;
          if (type === 'pnr') {
            switchTab('pnr');
            if (pnrInput) {
              pnrInput.value = val;
              if (pnrCounter) pnrCounter.textContent = `${val.length}/10`;
              $('pnr-form')?.dispatchEvent(new Event('submit'));
            }
          } else {
            switchTab('train');
            if (trainInput) {
              trainInput.value = val;
              if (trainCounter) trainCounter.textContent = `${val.length}/5`;
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

  // --- Form Submission: PNR Status ---
  $('pnr-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();
    
    const pnr = (pnrInput?.value || '').trim();
    if (!/^\d{10}$/.test(pnr)) {
      notify('कृपया वैध 10-अंकीय PNR नंबर दर्ज करें।');
      pnrInput?.focus();
      return;
    }

    if (!apiBase) {
      notify('RailPlus लाइव API अभी कॉन्फ़िगर नहीं है। आप नीचे दिए आधिकारिक IRCTC पोर्टल लिंक से जांच सकते हैं।');
      return;
    }

    const release = beginLoading($('btn-submit-pnr'));
    try {
      const data = await fetchLive('/api/pnr', { body: { number: pnr } });
      renderPNR(data);
    } catch (err) {
      notify(`PNR स्थिति प्राप्त नहीं हो सकी: ${err.message}. (यदि PNR बहुत पुराना है तो IRCTC आधिकारिक पोर्टल पर जांचें)`);
    } finally {
      release();
    }
  });

  // --- Form Submission: Live Train Status ---
  $('train-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const trainNum = (trainInput?.value || '').trim();
    const dateVal = dateInput?.value || '';

    if (!/^\d{5}$/.test(trainNum)) {
      notify('कृपया सही 5-अंकीय ट्रेन नंबर दर्ज करें (उदा. 12952)।');
      trainInput?.focus();
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      notify('कृपया ट्रेन चलने की सही तारीख चुनें।');
      return;
    }

    if (!apiBase) {
      notify('RailPlus लाइव API अभी कॉन्फ़िगर नहीं है। कृपया NTES आधिकारिक लिंक से जांचें।');
      return;
    }

    const release = beginLoading($('btn-submit-train'));
    try {
      const data = await fetchLive(`/api/train?number=${encodeURIComponent(trainNum)}&date=${encodeURIComponent(dateVal)}`);
      renderTrain(data);
    } catch (err) {
      notify(`ट्रेन रनिंग स्थिति प्राप्त नहीं हो सकी: ${err.message}`);
    } finally {
      release();
    }
  });

  // --- Demo Buttons (Instant UI Showcase) ---
  $('demo-pnr')?.addEventListener('click', () => {
    hideFeedback();
    if (pnrInput) {
      pnrInput.value = '2451893620';
      if (pnrCounter) pnrCounter.textContent = '10/10';
    }
    renderPNR({
      pnr: '2451893620',
      trainNumber: '12952',
      trainName: 'NEW DELHI - MUMBAI RAJDHANI EXPRESS',
      from: 'NEW DELHI (NDLS)',
      to: 'MUMBAI CENTRAL (MMCT)',
      journeyDate: '24-Nov-2026',
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
      if (trainCounter) trainCounter.textContent = '5/5';
    }
    renderTrain({
      trainNumber: '12952',
      trainName: 'MUMBAI RAJDHANI EXPRESS',
      currentStation: 'KOTA JN (KOTA)',
      delayMinutes: 0,
      progressPercent: 68,
      stations: [
        { name: 'NEW DELHI (NDLS)', scheduled: '16:55', expected: '16:55', status: 'passed', platform: '3' },
        { name: 'MATHURA JN (MTJ)', scheduled: '18:53', expected: '18:55', status: 'passed', platform: '1' },
        { name: 'KOTA JN (KOTA)', scheduled: '21:30', expected: '21:30', status: 'current', platform: '2' },
        { name: 'RATLAM JN (RTM)', scheduled: '00:40', expected: '00:40', status: 'upcoming', platform: '4' },
        { name: 'VADODARA JN (BRC)', scheduled: '03:45', expected: '03:45', status: 'upcoming', platform: '1' },
        { name: 'SURAT (ST)', scheduled: '05:15', expected: '05:15', status: 'upcoming', platform: '1' },
        { name: 'MUMBAI CENTRAL (MMCT)', scheduled: '08:35', expected: '08:35', status: 'upcoming', platform: '5' }
      ]
    }, true);
  });

  // Service Worker Registration
  if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
