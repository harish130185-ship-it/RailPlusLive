(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const config = window.RAIL_APP_CONFIG || {};
  const apiBase = (config.apiBaseUrl || '').replace(/\/$/, '');

  // Tab Order: PNR is ALWAYS FIRST, followed by Route, Seats, Live Train, Fare
  const TAB_NAMES = ['pnr', 'route', 'seats', 'train', 'fare'];

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
    TAB_NAMES.forEach((n) => {
      const tabEl = $(`tab-${n}`);
      const panelEl = $(`panel-${n}`);
      if (!tabEl || !panelEl) return;

      const isActive = n === name;
      tabEl.classList.toggle('active', isActive);
      tabEl.setAttribute('aria-selected', String(isActive));
      panelEl.hidden = !isActive;
      panelEl.classList.toggle('active', isActive);

      if (isActive && typeof tabEl.scrollIntoView === 'function') {
        tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    hideFeedback();
    const res = $('result');
    if (res) res.hidden = true;
  }

  TAB_NAMES.forEach(k => {
    $(`tab-${k}`)?.addEventListener('click', () => switchTab(k));
  });

  // Default to PNR Tab on page load
  switchTab('pnr');

  // Reset all forms and state back to fresh default
  function resetAllForms() {
    // 1. Reset all form elements
    ['pnr-form', 'route-form', 'seats-form', 'train-form', 'fare-form'].forEach(id => {
      const f = $(id);
      if (f) f.reset();
    });

    // 2. Reset dates to today
    ['journey-date', 'seats-date-input', 'fare-date-input', 'route-date-input'].forEach(id => {
      const el = $(id);
      if (el) el.value = todayIso;
    });

    // 3. Reset input counters
    if (pnrCounter) pnrCounter.textContent = '0 / 10 अंक';
    if (trainCounter) trainCounter.textContent = '0 / 5';

    // 4. Clear dataset codes and values on autocomplete inputs
    document.querySelectorAll('.station-autocomplete').forEach(el => {
      el.dataset.code = '';
      el.value = '';
    });
    document.querySelectorAll('.train-autocomplete').forEach(el => {
      el.value = '';
    });

    // 5. Close any open dropdowns
    document.querySelectorAll('.autocomplete-dropdown').forEach(dd => dd.classList.remove('open'));

    // 6. Hide feedback alert and result card
    hideFeedback();
    const res = $('result');
    if (res) {
      res.hidden = true;
      res.innerHTML = '';
    }

    // 7. Switch to default tab: PNR
    switchTab('pnr');

    // 8. Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 9. Show a brief clean confirmation toast
    notify('✓ सभी फ़ॉर्म रीसेट हो गए हैं (All Forms Refreshed)', false);
    setTimeout(() => {
      hideFeedback();
    }, 2200);
  }

  // Clicking RailPlus logo/brand refreshes/resets the form
  $('brand-logo-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    resetAllForms();
  });

  // Station Swap functionality (Swap Origin and Destination)
  function attachSwap(btnId, fromId, toId) {
    $(btnId)?.addEventListener('click', () => {
      const fromEl = $(fromId);
      const toEl = $(toId);
      if (!fromEl || !toEl) return;
      const tempVal = fromEl.value;
      const tempCode = fromEl.dataset.code;
      fromEl.value = toEl.value;
      fromEl.dataset.code = toEl.dataset.code || '';
      toEl.value = tempVal;
      toEl.dataset.code = tempCode || '';
    });
  }

  attachSwap('swap-route-stations', 'route-from-input', 'route-to-input');
  attachSwap('swap-seats-stations', 'seats-from-input', 'seats-to-input');
  attachSwap('swap-fare-stations', 'fare-from-input', 'fare-to-input');

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
        // Automatically submit when a quick train chip is clicked!
        $('train-form')?.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Quick Route Chips
  document.querySelectorAll('.quick-route-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fromStn = btn.dataset.from;
      const toStn = btn.dataset.to;
      const fromEl = $('route-from-input');
      const toEl = $('route-to-input');
      if (fromEl && fromStn) {
        fromEl.value = `${fromStn} — ${getStationName(fromStn)}`;
        fromEl.dataset.code = fromStn;
      }
      if (toEl && toStn) {
        toEl.value = `${toStn} — ${getStationName(toStn)}`;
        toEl.dataset.code = toStn;
      }
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

      if ('data' in json && json.data !== undefined) {
        return json.data;
      }
      return json;
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
  // STATION & TRAIN AUTOCOMPLETE COMPONENT
  // ==========================================================================
  const POPULAR_STATIONS = [
    { code: 'NDLS', name: 'New Delhi', hindi: 'नई दिल्ली' },
    { code: 'DLI', name: 'Old Delhi Jn', hindi: 'पुरानी दिल्ली' },
    { code: 'NZM', name: 'Hazrat Nizamuddin', hindi: 'ह. निजामुद्दीन' },
    { code: 'ANVT', name: 'Anand Vihar Terminal', hindi: 'आनंद विहार' },
    { code: 'MMCT', name: 'Mumbai Central', hindi: 'मुंबई सेंट्रल' },
    { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', hindi: 'छ.शि.म.ट. मुंबई' },
    { code: 'BDTS', name: 'Bandra Terminus', hindi: 'बांद्रा टर्मिनस' },
    { code: 'LTT', name: 'Lokmanya Tilak Terminus', hindi: 'लोकमान्य तिलक' },
    { code: 'HWH', name: 'Howrah Jn', hindi: 'हावड़ा' },
    { code: 'SDAH', name: 'Sealdah', hindi: 'सियालदह' },
    { code: 'KOAA', name: 'Kolkata Chitpur', hindi: 'कोलकाता' },
    { code: 'MAS', name: 'Chennai Central', hindi: 'चेन्नई सेंट्रल' },
    { code: 'MS', name: 'Chennai Egmore', hindi: 'चेन्नई एग्मोर' },
    { code: 'SBC', name: 'KSR Bengaluru City', hindi: 'बेंगलुरु सिटी' },
    { code: 'YPR', name: 'Yesvantpur Jn', hindi: 'यशवंतपुर' },
    { code: 'HYB', name: 'Hyderabad Deccan', hindi: 'हैदराबाद' },
    { code: 'SC', name: 'Secunderabad Jn', hindi: 'सिकंदराबाद' },
    { code: 'PNBE', name: 'Patna Jn', hindi: 'पटना जंक्शन' },
    { code: 'DNR', name: 'Danapur', hindi: 'दानापुर' },
    { code: 'RJPB', name: 'Rajendra Nagar Terminal', hindi: 'राजेन्द्र नगर' },
    { code: 'CNB', name: 'Kanpur Central', hindi: 'कानपुर सेंट्रल' },
    { code: 'LKO', name: 'Lucknow Charbagh NR', hindi: 'लखनऊ चारबाग' },
    { code: 'LJN', name: 'Lucknow Jn NER', hindi: 'लखनऊ जंक्शन' },
    { code: 'BSB', name: 'Varanasi Jn', hindi: 'वाराणसी' },
    { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Jn', hindi: 'पं. दीन दयाल उपाध्याय' },
    { code: 'GKP', name: 'Gorakhpur Jn', hindi: 'गोरखपुर' },
    { code: 'PRYJ', name: 'Prayagraj Jn (Allahabad)', hindi: 'प्रयागराज' },
    { code: 'JP', name: 'Jaipur Jn', hindi: 'जयपुर' },
    { code: 'ADI', name: 'Ahmedabad Jn', hindi: 'अहमदाबाद' },
    { code: 'PUNE', name: 'Pune Jn', hindi: 'पुणे' },
    { code: 'BPL', name: 'Bhopal Jn', hindi: 'भोपाल' },
    { code: 'RKMP', name: 'Rani Kamalapati (Habibganj)', hindi: 'रानी कमलापति' },
    { code: 'NGP', name: 'Nagpur Jn', hindi: 'नागपुर' },
    { code: 'BRC', name: 'Vadodara Jn', hindi: 'वडोदरा' },
    { code: 'ST', name: 'Surat', hindi: 'सूरत' },
    { code: 'GWL', name: 'Gwalior Jn', hindi: 'ग्वालियर' },
    { code: 'JHS', name: 'VGL Jhansi Jn', hindi: 'झांसी' },
    { code: 'AGC', name: 'Agra Cantt', hindi: 'आगरा कैंट' },
    { code: 'AF', name: 'Agra Fort', hindi: 'आगरा फोर्ट' },
    { code: 'MTJ', name: 'Mathura Jn', hindi: 'मथुरा' },
    { code: 'KOTA', name: 'Kota Jn', hindi: 'कोटा' },
    { code: 'RTM', name: 'Ratlam Jn', hindi: 'रतलाम' },
    { code: 'ASR', name: 'Amritsar Jn', hindi: 'अमृतसर' },
    { code: 'LDH', name: 'Ludhiana Jn', hindi: 'लुधियाना' },
    { code: 'CDG', name: 'Chandigarh', hindi: 'चंडीगढ़' },
    { code: 'UMB', name: 'Ambala Cantt', hindi: 'अंबाला कैंट' },
    { code: 'JAT', name: 'Jammu Tawi', hindi: 'जम्मू तवी' },
    { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', hindi: 'कटरा' },
    { code: 'GHY', name: 'Guwahati', hindi: 'गुवाहाटी' },
    { code: 'RNC', name: 'Ranchi Jn', hindi: 'रांची' },
    { code: 'TATA', name: 'Tatanagar Jn', hindi: 'टाटानगर' },
    { code: 'DHN', name: 'Dhanbad Jn', hindi: 'धनबाद' },
    { code: 'BJU', name: 'Barauni Jn', hindi: 'बरौनी' },
    { code: 'MFP', name: 'Muzaffarpur Jn', hindi: 'मुजफ्फरपुर' },
    { code: 'DBG', name: 'Darbhanga Jn', hindi: 'दरभंगा' },
    { code: 'BBS', name: 'Bhubaneswar', hindi: 'भुवनेश्वर' },
    { code: 'PURI', name: 'Puri', hindi: 'पुरी' },
    { code: 'VSKP', name: 'Visakhapatnam', hindi: 'विशाखापट्टनम' },
    { code: 'BZA', name: 'Vijayawada Jn', hindi: 'विजयवाड़ा' },
    { code: 'TVC', name: 'Thiruvananthapuram Central', hindi: 'तिरुवनंतपुरम' },
    { code: 'ERS', name: 'Ernakulam Jn (South)', hindi: 'एर्नाकुलम' },
    { code: 'CLT', name: 'Kozhikode Main (Calicut)', hindi: 'कोझिकोड' },
    { code: 'CBE', name: 'Coimbatore Jn', hindi: 'कोयंबटूर' },
    { code: 'MDU', name: 'Madurai Jn', hindi: 'मदुरै' },
    { code: 'MAQ', name: 'Mangaluru Central', hindi: 'मंगलुरु' },
    { code: 'UJN', name: 'Ujjain Jn', hindi: 'उज्जैन' },
    { code: 'INDB', name: 'Indore Jn', hindi: 'इंदौर' },
    { code: 'JU', name: 'Jodhpur Jn', hindi: 'जोधपुर' },
    { code: 'BKN', name: 'Bikaner Jn', hindi: 'बीकानेर' },
    { code: 'AII', name: 'Ajmer Jn', hindi: 'अजमेर' },
    { code: 'UDZ', name: 'Udaipur City', hindi: 'उदयपुर' },
    { code: 'R', name: 'Raipur Jn', hindi: 'रायपुर' },
    { code: 'BSP', name: 'Bilaspur Jn', hindi: 'बिलासपुर' },
    { code: 'JBP', name: 'Jabalpur', hindi: 'जबलपुर' },
    { code: 'ET', name: 'Itarsi Jn', hindi: 'इटारसी' },
    { code: 'BSL', name: 'Bhusaval Jn', hindi: 'भुसावल' },
    { code: 'BAP', name: 'Belapur', hindi: 'बेलापुर' },
    { code: 'SNSI', name: 'Sainagar Shirdi', hindi: 'शिर्डी' },
    { code: 'HW', name: 'Haridwar', hindi: 'हरिद्वार' },
    { code: 'DDN', name: 'Dehradun', hindi: 'देहरादून' },
    { code: 'KGM', name: 'Kathgodam', hindi: 'काठगोदाम' },
    { code: 'MYS', name: 'Mysuru Jn', hindi: 'मैसूर' },
    { code: 'TPJ', name: 'Tiruchchirappalli Jn', hindi: 'त्रिची' },
    { code: 'RU', name: 'Renigunta Jn (Tirupati)', hindi: 'तिरुपति' },
    { code: 'TPTY', name: 'Tirupati Main', hindi: 'तिरुपति मेन' }
  ];

  const POPULAR_TRAINS = [
    { number: '12952', name: 'Tejas Rajdhani Express (NDLS ➔ MMCT)', type: 'RAJDHANI' },
    { number: '12951', name: 'Tejas Rajdhani Express (MMCT ➔ NDLS)', type: 'RAJDHANI' },
    { number: '12954', name: 'August Kranti Rajdhani (NZM ➔ MMCT)', type: 'RAJDHANI' },
    { number: '12953', name: 'August Kranti Rajdhani (MMCT ➔ NZM)', type: 'RAJDHANI' },
    { number: '12004', name: 'Lucknow Shatabdi Express (NDLS ➔ LKO)', type: 'SHATABDI' },
    { number: '12002', name: 'Bhopal Shatabdi Express (NDLS ➔ RKMP)', type: 'SHATABDI' },
    { number: '22436', name: 'Vande Bharat Express (NDLS ➔ BSB)', type: 'VANDE BHARAT' },
    { number: '22435', name: 'Vande Bharat Express (BSB ➔ NDLS)', type: 'VANDE BHARAT' },
    { number: '20901', name: 'Vande Bharat Express (MMCT ➔ GNC)', type: 'VANDE BHARAT' },
    { number: '12301', name: 'Howrah Rajdhani Express (HWH ➔ NDLS)', type: 'RAJDHANI' },
    { number: '12302', name: 'Howrah Rajdhani Express (NDLS ➔ HWH)', type: 'RAJDHANI' },
    { number: '12309', name: 'Patna Rajdhani Express (RJPB ➔ NDLS)', type: 'RAJDHANI' },
    { number: '12310', name: 'Patna Rajdhani Express (NDLS ➔ RJPB)', type: 'RAJDHANI' },
    { number: '12424', name: 'Dibrugarh Rajdhani Express (NDLS ➔ DBRT)', type: 'RAJDHANI' },
    { number: '12904', name: 'Golden Temple Mail (ASR ➔ MMCT)', type: 'SUPERFAST' },
    { number: '12926', name: 'Paschim Express (ASR ➔ BDTS)', type: 'SUPERFAST' },
    { number: '12555', name: 'Gorakhdham Express (GKP ➔ BTI)', type: 'SUPERFAST' },
    { number: '12556', name: 'Gorakhdham Express (BTI ➔ GKP)', type: 'SUPERFAST' },
    { number: '12565', name: 'Bihar Sampark Kranti (DBG ➔ NDLS)', type: 'SUPERFAST' },
    { number: '12393', name: 'Sampoorna Kranti Express (RJPB ➔ NDLS)', type: 'SUPERFAST' },
    { number: '12417', name: 'Prayagraj Express (PRYJ ➔ NDLS)', type: 'SUPERFAST' },
    { number: '12626', name: 'Kerala Express (NDLS ➔ TVC)', type: 'SUPERFAST' },
    { number: '12622', name: 'Tamil Nadu Express (NDLS ➔ MAS)', type: 'SUPERFAST' },
    { number: '12802', name: 'Purushottam Express (NDLS ➔ PURI)', type: 'SUPERFAST' },
    { number: '22692', name: 'Bengaluru Rajdhani Express (NZM ➔ SBC)', type: 'RAJDHANI' },
    { number: '12259', name: 'Sealdah Bikaner Duronto', type: 'DURONTO' }
  ];

  function getStationName(code) {
    const found = POPULAR_STATIONS.find(s => s.code.toUpperCase() === code.toUpperCase());
    return found ? found.name : code;
  }

  // Helper to extract clean station code from input
  function extractStationCode(el) {
    if (!el) return '';
    if (el.dataset?.code) return el.dataset.code.trim().toUpperCase();
    const val = (el.value || '').trim();
    if (!val) return '';
    // Format could be "NDLS — New Delhi" or "NDLS - New Delhi" or "NDLS"
    const match = val.match(/^([A-Za-z0-9]{1,5})\s*[\—\-]/);
    if (match) return match[1].toUpperCase();
    const parts = val.split(/[\s—\-]+/);
    if (parts[0] && parts[0].length <= 5) return parts[0].toUpperCase();
    // Search in popular stations by name
    const found = POPULAR_STATIONS.find(s => s.name.toLowerCase() === val.toLowerCase() || s.code.toLowerCase() === val.toLowerCase());
    if (found) return found.code;
    return val.slice(0, 5).toUpperCase();
  }

  // Setup Autocomplete for Station Inputs
  function setupStationAutocomplete(input) {
    if (!input) return;
    const container = input.closest('.autocomplete-container') || input.parentElement;
    if (!container) return;

    let dropdown = container.querySelector('.autocomplete-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'autocomplete-dropdown';
      container.appendChild(dropdown);
    }

    let activeIndex = -1;
    let debounceTimer = null;

    function renderList(list) {
      if (!list || list.length === 0) {
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        return;
      }

      dropdown.innerHTML = list.map((stn, idx) => `
        <div class="autocomplete-item ${idx === activeIndex ? 'active' : ''}" data-code="${safe(stn.code)}" data-name="${safe(stn.name)}">
          <div class="ac-code-badge">${safe(stn.code)}</div>
          <div style="flex:1;">
            <div class="ac-name-text">${safe(stn.name)}</div>
            ${stn.hindi ? `<div class="ac-sub-text">${safe(stn.hindi)}</div>` : ''}
          </div>
        </div>
      `).join('');

      dropdown.classList.add('open');

      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          const code = item.dataset.code;
          const name = item.dataset.name;
          input.value = `${code} — ${name}`;
          input.dataset.code = code;
          dropdown.classList.remove('open');
        });
      });
    }

    async function searchStations(query) {
      const q = query.trim().toUpperCase();
      if (!q) {
        dropdown.classList.remove('open');
        return;
      }

      // 1. Search local dictionary
      const localMatches = POPULAR_STATIONS.filter(s =>
        s.code.includes(q) ||
        s.name.toUpperCase().includes(q) ||
        (s.hindi && s.hindi.includes(q))
      ).slice(0, 8);

      renderList(localMatches);

      // 2. If query >= 2 chars, fetch live server suggestions
      if (q.length >= 2 && apiBase) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          try {
            const res = await fetchLive(`/api/stations?q=${encodeURIComponent(q)}`);
            const serverStations = res?.stations || (Array.isArray(res) ? res : []);
            if (serverStations && serverStations.length > 0) {
              const merged = [...localMatches];
              serverStations.forEach(stn => {
                const code = stn.code || stn.stationCode;
                const name = stn.name || stn.stationName;
                if (code && !merged.some(m => m.code === code)) {
                  merged.push({ code, name });
                }
              });
              renderList(merged.slice(0, 10));
            }
          } catch (_) {}
        }, 250);
      }
    }

    input.addEventListener('input', (e) => {
      // Clear dataset code on manual edit
      input.dataset.code = '';
      searchStations(e.target.value);
    });

    input.addEventListener('focus', () => {
      if (input.value) searchStations(input.value);
    });

    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.autocomplete-item');
      if (!items.length || !dropdown.classList.contains('open')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        items.forEach((it, idx) => it.classList.toggle('active', idx === activeIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        items.forEach((it, idx) => it.classList.toggle('active', idx === activeIndex));
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          items[activeIndex].click();
        }
      } else if (e.key === 'Escape') {
        dropdown.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  // Setup Autocomplete for Train Inputs
  function setupTrainAutocomplete(input, autoSubmitForm = false) {
    if (!input) return;
    const container = input.closest('.autocomplete-container') || input.parentElement;
    if (!container) return;

    let dropdown = container.querySelector('.autocomplete-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'autocomplete-dropdown';
      container.appendChild(dropdown);
    }

    let debounceTimer = null;

    function renderList(list) {
      if (!list || list.length === 0) {
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        return;
      }

      dropdown.innerHTML = list.map(t => `
        <div class="autocomplete-item" data-number="${safe(t.number)}" data-name="${safe(t.name)}">
          <div class="ac-code-badge" style="background:#0f294a;color:#ffffff;">${safe(t.number)}</div>
          <div style="flex:1;">
            <div class="ac-name-text">${safe(t.name)}</div>
            ${t.type ? `<div class="ac-sub-text">${safe(t.type)}</div>` : ''}
          </div>
        </div>
      `).join('');

      dropdown.classList.add('open');

      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          const number = item.dataset.number;
          input.value = number;
          dropdown.classList.remove('open');
          
          const counter = $(`${input.id === 'train-input' ? 'train-counter' : ''}`);
          if (counter) counter.textContent = `${number.length} / 5`;

          // Auto-trigger live status immediately on selection!
          if (autoSubmitForm) {
            $('train-form')?.dispatchEvent(new Event('submit'));
          }
        });
      });
    }

    async function searchTrains(query) {
      const q = query.trim().toUpperCase();
      if (!q) {
        dropdown.classList.remove('open');
        return;
      }

      // Local matches
      const localMatches = POPULAR_TRAINS.filter(t =>
        t.number.includes(q) || t.name.toUpperCase().includes(q)
      ).slice(0, 6);

      renderList(localMatches);

      // Server search
      if (q.length >= 2 && apiBase) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          try {
            const res = await fetchLive(`/api/trains?q=${encodeURIComponent(q)}`);
            const serverTrains = res?.trains || (Array.isArray(res) ? res : []);
            if (serverTrains && serverTrains.length > 0) {
              const merged = [...localMatches];
              serverTrains.forEach(t => {
                if (t.number && !merged.some(m => m.number === t.number)) {
                  merged.push(t);
                }
              });
              renderList(merged.slice(0, 8));
            }
          } catch (_) {}
        }, 250);
      }
    }

    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      searchTrains(val);

      // If user directly typed 5 digits in Live Train, automatically trigger search!
      if (autoSubmitForm && /^\d{5}$/.test(val)) {
        dropdown.classList.remove('open');
        $('train-form')?.dispatchEvent(new Event('submit'));
      }
    });

    input.addEventListener('focus', () => {
      if (input.value) searchTrains(input.value);
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  // Initialize Autocompletes across all tabs
  document.querySelectorAll('.station-autocomplete').forEach(setupStationAutocomplete);
  if ($('train-input')) setupTrainAutocomplete($('train-input'), true);
  if ($('seats-train-input')) setupTrainAutocomplete($('seats-train-input'), false);
  if ($('fare-train-input')) setupTrainAutocomplete($('fare-train-input'), false);

  // ==========================================================================
  // 1. Render PNR Slip (Full Details with Chart Status Banner)
  // ==========================================================================
  function renderPNR(data, demo = false) {
    saveRecent('pnr', data.pnr);

    const chartText = String(data.chartStatus || '').toLowerCase();
    const isChartPrepared = chartText.includes('prepared') && !chartText.includes('not');

    const passengers = Array.isArray(data.passengers) ? data.passengers : [];
    const rows = passengers.length > 0
      ? passengers.map((p, idx) => {
          const currentCls = getStatusClass(p.currentStatus);
          const berthInfo = [
            p.coach ? `कोच: <strong>${safe(p.coach)}</strong>` : '',
            p.berth ? `बर्थ: <strong>${safe(p.berth)}</strong>` : '',
            p.berthType ? `(${safe(p.berthType)})` : ''
          ].filter(Boolean).join(' ');

          return `
            <tr>
              <td>
                <div style="font-weight:700;color:#0f294a;">यात्री ${idx + 1}</div>
                ${berthInfo ? `<div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${berthInfo}</div>` : ''}
              </td>
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
        <!-- Top Train Header -->
        <div class="ticket-topbar">
          <div class="ticket-train-header">
            <span class="train-num-tag">${safe(data.trainNumber)}</span>
            <span class="train-title">${safe(data.trainName)}</span>
          </div>
          <div>
            <span class="chart-tag ${isChartPrepared ? 'prepared' : 'not-prepared'}">
              ${isChartPrepared ? '🟢 चार्ट तैयार है' : '🟡 चार्ट नहीं बना'}
            </span>
          </div>
        </div>

        <!-- Prominent Chart Status Banner -->
        <div class="chart-status-banner ${isChartPrepared ? 'prepared' : 'not-prepared'}">
          <div class="chart-status-icon">${isChartPrepared ? '✓' : 'ℹ'}</div>
          <div>
            <h4>${isChartPrepared ? 'चार्ट तैयार हो चुका है (Chart Prepared)' : 'चार्ट अभी तैयार नहीं हुआ (Chart Not Prepared)'}</h4>
            <p>${isChartPrepared
              ? 'ट्रेन का अंतिम चार्टिंग पूरा हो चुका है। सीटें और बोगी (Coach & Berth) आबंटित हैं।'
              : 'ट्रेन प्रस्थान से लगभग 4 घंटे पहले IRCTC द्वारा पहला आरक्षण चार्ट तैयार किया जाता है।'
            }</p>
          </div>
        </div>

        <!-- Journey Route Bar -->
        <div class="ticket-route-row">
          <div class="station-point source">
            <span class="stn-label">प्रस्थान (Origin)</span>
            <span class="stn-name">${safe(data.from || 'Origin')}</span>
          </div>
          <div class="route-mid">
            <span class="route-arrow">➔</span>
            <span class="date-pill">यात्रा तिथि: <strong>${safe(data.journeyDate || '—')}</strong></span>
          </div>
          <div class="station-point destination">
            <span class="stn-label">गंतव्य (Destination)</span>
            <span class="stn-name">${safe(data.to || 'Destination')}</span>
          </div>
        </div>

        <!-- Comprehensive Ticket Details Grid -->
        <div class="ticket-details-grid">
          <div class="detail-item">
            <span class="detail-lbl">बोर्डिंग स्टेशन (Boarding)</span>
            <span class="detail-val">${safe(data.boardingPoint || data.from)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-lbl">आरक्षण तक (Reservation Upto)</span>
            <span class="detail-val">${safe(data.reservationUpto || data.to)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-lbl">क्लास एवं कोटा (Class &amp; Quota)</span>
            <span class="detail-val">${safe(data.journeyClass || '3A')} | ${safe(data.quota || 'GN')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-lbl">चार्टिंग स्टेशन (Charting At)</span>
            <span class="detail-val">${safe(data.chartingStation || data.from)}</span>
          </div>
        </div>

        <!-- Passenger Status Body -->
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
                <th style="width: 30%;">यात्री एवं कोच</th>
                <th style="width: 35%;">बुकिंग स्टेटस (Booking)</th>
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
            <p>${safe(data.from)} ➔ ${safe(data.to)} | क्लास: <strong>${safe(data.class || '3A')}</strong> | कोटा: <strong>${safe(data.quota || 'GN')}</strong></p>
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
  // 5. Render Route & Trains Between Stations Result with Class Fares & Status
  // ==========================================================================
  const CLASS_LABELS = {
    'SL': 'स्लीपर',
    '3A': '3 एसी',
    '2A': '2 एसी',
    '1A': '1 एसी',
    '3E': '3 इकोनॉमी',
    'CC': 'चेयर कार',
    '2S': '2S सीटिंग',
    'EC': 'एग्जीक्यूटिव'
  };

  const BOOKABLE_CLASSES = ['SL', '3E', '3A', '2A', '1A', 'CC', '2S', 'EC'];

  const DEMO_TRAIN_CLASSES = {
    '12952': {
      '3A': { fare: '3,165', status: 'AVAILABLE 38', type: 'available', pred: '94% Chance' },
      '2A': { fare: '4,480', status: 'AVAILABLE 12', type: 'available', pred: '88% Chance' },
      '1A': { fare: '5,890', status: 'RAC 04', type: 'rac', pred: '76% Chance' }
    },
    '12954': {
      '3A': { fare: '3,140', status: 'WL 24', type: 'waitlist', pred: '62% Chance' },
      '2A': { fare: '4,450', status: 'AVAILABLE 08', type: 'available', pred: '91% Chance' },
      '1A': { fare: '5,850', status: 'AVAILABLE 02', type: 'available', pred: '85% Chance' }
    },
    '12904': {
      'SL': { fare: '655', status: 'WL 83', type: 'waitlist', pred: '45% Chance' },
      '3A': { fare: '1,745', status: 'AVAILABLE 19', type: 'available', pred: '90% Chance' },
      '2A': { fare: '2,510', status: 'AVAILABLE 06', type: 'available', pred: '82% Chance' },
      '1A': { fare: '4,235', status: 'RAC 02', type: 'rac', pred: '70% Chance' }
    },
    '12926': {
      'SL': { fare: '660', status: 'RAC 14', type: 'rac', pred: '78% Chance' },
      '3A': { fare: '1,760', status: 'AVAILABLE 42', type: 'available', pred: '96% Chance' },
      '2A': { fare: '2,530', status: 'WL 05', type: 'waitlist', pred: '68% Chance' },
      '1A': { fare: '4,260', status: 'AVAILABLE 03', type: 'available', pred: '89% Chance' }
    }
  };

  const routeSeatCache = new Map();

  function parseTrainClasses(t) {
    if (t.classes && typeof t.classes === 'string') {
      const raw = t.classes.split(',').map(s => s.trim().toUpperCase());
      const matched = BOOKABLE_CLASSES.filter(c => raw.includes(c));
      if (matched.length > 0) return matched;
    }
    const name = (t.trainName || '').toUpperCase();
    if (name.includes('RAJDHANI') || name.includes('TEJAS')) {
      return ['3A', '2A', '1A'];
    }
    if (name.includes('SHATABDI')) {
      return ['CC', 'EC'];
    }
    if (name.includes('GARIB RATH')) {
      return ['3A', 'CC'];
    }
    return ['SL', '3A', '2A', '1A'];
  }

  function applySeatDataToCard(data, fareEl, statusEl, predEl) {
    if (!data) return;

    if (fareEl && data.fare?.total) {
      fareEl.textContent = `₹${Number(data.fare.total).toLocaleString('en-IN')}`;
    }

    const firstAvail = Array.isArray(data.availability) ? data.availability[0] : null;
    if (statusEl && firstAvail) {
      const rawStatus = (firstAvail.status || '').toUpperCase();
      statusEl.className = 'class-status-text';

      if (rawStatus.includes('AVAILABLE') || rawStatus.includes('CURR_AVBL') || rawStatus.startsWith('AVL')) {
        statusEl.classList.add('available');
        statusEl.textContent = rawStatus.replace(/AVAILABLE\s*/i, 'AVL ').trim() || 'AVAILABLE';
      } else if (rawStatus.includes('RAC')) {
        statusEl.classList.add('rac');
        statusEl.textContent = rawStatus;
      } else if (rawStatus.includes('WL') || rawStatus.includes('WAITLIST')) {
        statusEl.classList.add('waitlist');
        statusEl.textContent = rawStatus;
      } else if (rawStatus.includes('REGRET') || rawStatus.includes('NOT AVAILABLE')) {
        statusEl.style.background = '#fee2e2';
        statusEl.style.color = '#991b1b';
        statusEl.textContent = 'REGRET';
      } else {
        statusEl.textContent = rawStatus || 'जांचें';
      }

      if (predEl && firstAvail.prediction) {
        predEl.textContent = firstAvail.prediction;
        predEl.hidden = false;
      }
    }
  }

  async function fetchClassSeat(trainNo, fromCode, toCode, date, cls) {
    const cacheKey = `${trainNo}_${fromCode}_${toCode}_${date}_${cls}`;
    const fareEl = document.getElementById(`fare-${trainNo}-${cls}`);
    const statusEl = document.getElementById(`status-${trainNo}-${cls}`);
    const predEl = document.getElementById(`pred-${trainNo}-${cls}`);

    if (routeSeatCache.has(cacheKey)) {
      applySeatDataToCard(routeSeatCache.get(cacheKey), fareEl, statusEl, predEl);
      return;
    }

    if (statusEl) {
      statusEl.className = 'class-status-text loading';
      statusEl.textContent = 'जांच हो रही...';
    }

    try {
      const url = `/api/seats?number=${encodeURIComponent(trainNo)}&from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&date=${encodeURIComponent(date)}&class=${encodeURIComponent(cls)}&quota=GN`;
      const res = await fetchLive(url);
      routeSeatCache.set(cacheKey, res);
      applySeatDataToCard(res, fareEl, statusEl, predEl);
    } catch (err) {
      if (statusEl) {
        statusEl.className = 'class-status-text';
        statusEl.style.background = '#f1f5f9';
        statusEl.style.color = '#64748b';
        statusEl.textContent = 'उपलब्ध नहीं';
      }
    }
  }

  function renderRoute(data, demo = false, ctx = {}) {
    const trains = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.trains) ? data.trains : []));
    const searchFrom = ctx.from || extractStationCode($('route-from-input'));
    const searchTo = ctx.to || extractStationCode($('route-to-input'));
    const targetDate = ctx.date || ($('route-date-input')?.value || todayIso);

    const items = trains.map((t) => {
      const classes = parseTrainClasses(t);
      const trainNo = String(t.trainNumber || '');
      const fromStn = t.fromCode || searchFrom;
      const toStn = t.toCode || searchTo;

      const classesHtml = classes.map(cls => {
        let clsData = null;
        if (demo && DEMO_TRAIN_CLASSES[trainNo] && DEMO_TRAIN_CLASSES[trainNo][cls]) {
          clsData = DEMO_TRAIN_CLASSES[trainNo][cls];
        }

        const fareText = clsData?.fare ? `₹${clsData.fare}` : '₹—';
        const statusClass = clsData?.type ? `class-status-text ${clsData.type}` : 'class-status-text loading';
        const statusText = clsData?.status || (demo ? 'उपलब्ध नहीं' : 'सीट देखें ➔');
        const predText = clsData?.pred || '';

        return `
          <div class="class-card ${clsData?.type || ''}" 
               id="class-${safe(trainNo)}-${safe(cls)}"
               data-train="${safe(trainNo)}" 
               data-from="${safe(fromStn)}" 
               data-to="${safe(toStn)}" 
               data-date="${safe(targetDate)}" 
               data-class="${safe(cls)}"
               role="button"
               tabindex="0"
               title="${safe(cls)} — ${safe(CLASS_LABELS[cls] || '')}">
            <div class="class-card-head">
              <span class="class-code">${safe(cls)} <small style="font-size:0.65rem;color:#64748b;font-weight:normal;">${safe(CLASS_LABELS[cls] || '')}</small></span>
              <span class="class-fare" id="fare-${safe(trainNo)}-${safe(cls)}">${safe(fareText)}</span>
            </div>
            <div class="${statusClass}" id="status-${safe(trainNo)}-${safe(cls)}">
              ${safe(statusText)}
            </div>
            <div class="class-prediction-text" id="pred-${safe(trainNo)}-${safe(cls)}" ${predText ? '' : 'hidden'}>
              ${safe(predText)}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="train-journey-card" data-train-number="${safe(trainNo)}">
          <div class="train-card-top">
            <div class="train-title-area">
              <h3>${safe(t.trainNumber)} — ${safe(t.trainName)}</h3>
              ${t.type ? `<span class="train-type-tag">${safe(t.type)}</span>` : ''}
              ${t.nameHindi ? `<span style="font-size:0.8rem;color:#475569;">(${safe(t.nameHindi)})</span>` : ''}
            </div>
            <div class="train-days-info">
              ${t.runningDays === '1111111' ? '<span>प्रतिदिन (All Days)</span>' : (t.runningDays ? `<span>दौड़ने के दिन: ${safe(t.runningDays)}</span>` : '<span>नियमित सेवा</span>')}
            </div>
          </div>

          <div class="train-schedule-row">
            <div class="stn-block source">
              <div class="stn-time">${safe(t.departure)}</div>
              <div class="stn-sub"><strong>${safe(t.fromCode || t.from)}</strong> ${t.from && t.from !== t.fromCode ? `• ${safe(t.from)}` : ''}</div>
            </div>

            <div class="stn-journey-mid">
              <div class="journey-duration">${safe(t.duration || '—')}</div>
              <div class="journey-line"></div>
              <div class="journey-extra">
                ${t.distance ? `${safe(t.distance)} किमी` : ''} 
                ${t.halts && Number(t.halts) > 0 ? `• ${safe(t.halts)} ठहराव` : ''}
              </div>
            </div>

            <div class="stn-block destination">
              <div class="stn-time">${safe(t.arrival)}</div>
              <div class="stn-sub"><strong>${safe(t.toCode || t.to)}</strong> ${t.to && t.to !== t.toCode ? `• ${safe(t.to)}` : ''}</div>
            </div>
          </div>

          <div class="train-classes-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:0.75rem;font-weight:600;color:#334155;">
                सीट स्थिति एवं किराया (Sleeper, 3A, 2A, 1A):
              </span>
              <span style="font-size:0.7rem;color:#64748b;">
                ${demo ? 'डेमो स्थिति' : 'किसी भी क्लास पर क्लिक करके सीट चेक करें'}
              </span>
            </div>
            <div class="train-classes-container">
              ${classesHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div class="route-result-card">
        <div class="result-card-header">
          <div>
            <h2>${searchFrom ? safe(searchFrom) : ''} ➔ ${searchTo ? safe(searchTo) : ''} ट्रेनों की सूची</h2>
            <p>कुल ट्रेनें: <strong>${trains.length}</strong> • यात्रा तिथि: <strong>${safe(targetDate)}</strong></p>
          </div>
          <div>
            <span class="card-badge">डायरेक्ट ट्रेनें &amp; सीट स्थिति</span>
          </div>
        </div>

        <div class="route-trains-list" style="display:flex;flex-direction:column;gap:14px;">
          ${items || '<p style="padding:20px;text-align:center;color:#64748b;">इस रूट पर कोई डायरेक्ट ट्रेन नहीं मिली।</p>'}
        </div>

        <div class="ticket-meta-footer">
          <div>
            ${demo ? '<strong style="color:#d97706;">[काल्पनिक रूट एवं सीट डेटा - Sample Mode]</strong>' : '<span>स्रोत: Indian Railways Timetable &amp; Live Availability</span>'}
          </div>
          <div>
            <span>जांच: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    `;

    showResult(html);

    // Attach click listeners to all class cards
    document.querySelectorAll('.class-card').forEach(card => {
      card.addEventListener('click', () => {
        const { train, from, to, date, cls } = card.dataset;
        if (train && from && to && date && cls) {
          fetchClassSeat(train, from, to, date, cls);
        }
      });
    });

    // Auto-fetch seats for top 2 trains in live mode (with staggering)
    if (!demo && trains.length > 0) {
      const topTrains = trains.slice(0, 2);
      let delay = 300;
      topTrains.forEach(t => {
        const classes = parseTrainClasses(t).slice(0, 3);
        const tNo = String(t.trainNumber || '');
        const fromStn = t.fromCode || searchFrom;
        const toStn = t.toCode || searchTo;

        classes.forEach(cls => {
          setTimeout(() => {
            fetchClassSeat(tNo, fromStn, toStn, targetDate, cls);
          }, delay);
          delay += 500;
        });
      });
    }
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

  // Form 2: Route
  $('route-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const from = extractStationCode($('route-from-input'));
    const to = extractStationCode($('route-to-input'));
    const date = $('route-date-input')?.value || '';

    if (!from || !to || from === to) {
      notify('कृपया शुरुआत और गंतव्य के सही स्टेशन कोड दर्ज करें (उदा. NDLS और MMCT)।');
      return;
    }

    const release = beginLoading($('btn-submit-route'));
    try {
      const data = await fetchLive(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${date ? `&date=${encodeURIComponent(date)}` : ''}`);
      renderRoute(data, false, { from, to, date });
    } catch (err) {
      notify(`रूट जानकारी नहीं मिली: ${err.message}`);
    } finally {
      release();
    }
  });

  // Form 3: Seats Availability (From/To required, Train Number optional)
  $('seats-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const from = extractStationCode($('seats-from-input'));
    const to = extractStationCode($('seats-to-input'));
    const date = $('seats-date-input')?.value || todayIso;
    const trainNumber = ($('seats-train-input')?.value || '').trim();
    const cls = $('seats-class-select')?.value || '';
    const quota = $('seats-quota-select')?.value || 'GN';

    if (!from || !to || from === to) {
      notify('कृपया शुरुआत (From) और गंतव्य (To) के सही स्टेशन कोड दर्ज करें।');
      return;
    }

    const release = beginLoading($('btn-submit-seats'));

    try {
      // If train number is given (5 digits), look up seat availability specifically for that train
      if (/^\d{5}$/.test(trainNumber)) {
        const selectedClass = cls || '3A';
        const data = await fetchLive(`/api/seats?number=${encodeURIComponent(trainNumber)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&class=${encodeURIComponent(selectedClass)}&quota=${encodeURIComponent(quota)}`);
        renderSeats(data);
      } else {
        // If train number is NOT given, search all trains between stations and show seats underneath!
        const data = await fetchLive(`/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${date ? `&date=${encodeURIComponent(date)}` : ''}`);
        renderRoute(data, false, { from, to, date });
      }
    } catch (err) {
      notify(`सीट उपलब्धता जानकारी नहीं मिली: ${err.message}`);
    } finally {
      release();
    }
  });

  // Form 4: Live Train
  $('train-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const rawTrain = (trainInput?.value || '').trim();
    const trainNumMatch = rawTrain.match(/\b\d{5}\b/);
    const trainNum = trainNumMatch ? trainNumMatch[0] : rawTrain;
    const dateVal = trainDateInput?.value || todayIso;

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

  // Form 5: Fare
  $('fare-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const number = ($('fare-train-input')?.value || '').trim();
    const from = extractStationCode($('fare-from-input'));
    const to = extractStationCode($('fare-to-input'));
    const date = $('fare-date-input')?.value || '';
    const cls = $('fare-class-select')?.value || '3A';
    const quota = $('fare-quota-select')?.value || 'GN';

    if (!/^\d{5}$/.test(number)) {
      notify('कृपया 5-अंकों का ट्रेन नंबर दर्ज करें।');
      return;
    }
    if (!from || !to || from === to) {
      notify('कृपया शुरुआत और गंतव्य के सही स्टेशन कोड दर्ज करें।');
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
      trainName: 'नई दिल्ली - मुंबई तेजस राजधानी एक्सप्रेस',
      from: 'नई दिल्ली (NDLS)',
      to: 'मुंबई सेंट्रल (MMCT)',
      boardingPoint: 'नई दिल्ली (NDLS)',
      reservationUpto: 'मुंबई सेंट्रल (MMCT)',
      chartingStation: 'नई दिल्ली (NDLS)',
      journeyClass: '3A (Third AC)',
      quota: 'GN (General)',
      journeyDate: '24-नवंबर-2026',
      chartStatus: 'Chart Prepared',
      passengers: [
        { bookingStatus: 'B3, 42 (Lower)', currentStatus: 'CNF B3-42', coach: 'B3', berth: '42', berthType: 'Lower Berth' },
        { bookingStatus: 'B3, 43 (Middle)', currentStatus: 'CNF B3-43', coach: 'B3', berth: '43', berthType: 'Middle Berth' },
        { bookingStatus: 'WL 14', currentStatus: 'RAC 04', coach: 'B4', berth: 'RAC', berthType: 'Side Lower' }
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
    const fromEl = $('seats-from-input');
    const toEl = $('seats-to-input');
    const trainEl = $('seats-train-input');
    if (fromEl) { fromEl.value = 'NDLS — New Delhi'; fromEl.dataset.code = 'NDLS'; }
    if (toEl) { toEl.value = 'MMCT — Mumbai Central'; toEl.dataset.code = 'MMCT'; }
    if (trainEl) trainEl.value = '12952';

    renderSeats({
      trainNumber: '12952',
      trainName: 'MMCT TEJAS RAJDHANI',
      from: 'नई दिल्ली (NDLS)',
      to: 'मुंबई सेंट्रल (MMCT)',
      class: '3A',
      quota: 'GN',
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
    const fromEl = $('fare-from-input');
    const toEl = $('fare-to-input');
    if (fromEl) { fromEl.value = 'NDLS — New Delhi'; fromEl.dataset.code = 'NDLS'; }
    if (toEl) { toEl.value = 'MMCT — Mumbai Central'; toEl.dataset.code = 'MMCT'; }
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
    const fromEl = $('route-from-input');
    const toEl = $('route-to-input');
    if (fromEl) { fromEl.value = 'NDLS — New Delhi'; fromEl.dataset.code = 'NDLS'; }
    if (toEl) { toEl.value = 'MMCT — Mumbai Central'; toEl.dataset.code = 'MMCT'; }
    renderRoute([
      { trainNumber: '12952', trainName: 'TEJAS RAJDHANI EXP', nameHindi: 'तेजस राजधानी', type: 'RAJDHANI', fromCode: 'NDLS', from: 'नई दिल्ली', toCode: 'MMCT', to: 'मुंबई सेंट्रल', departure: '16:55', arrival: '08:35', duration: '15:40 hrs', distance: '1384', halts: 7, runningDays: '1111111', classes: '3A,2A,1A' },
      { trainNumber: '12954', trainName: 'AUGUST KRANTI RAJ', nameHindi: 'अगस्त क्रांति राजधानी', type: 'RAJDHANI', fromCode: 'NZM', from: 'ह. निजामुद्दीन', toCode: 'MMCT', to: 'मुंबई सेंट्रल', departure: '17:15', arrival: '10:05', duration: '16:50 hrs', distance: '1377', halts: 11, runningDays: '1111111', classes: '3A,2A,1A' },
      { trainNumber: '12904', trainName: 'GOLDEN TEMPLE MAIL', nameHindi: 'गोल्डन टेम्पल मेल', type: 'SUPERFAST', fromCode: 'NZM', from: 'ह. निजामुद्दीन', toCode: 'BDTS', to: 'बांद्रा टर्मिनस', departure: '04:00', arrival: '23:55', duration: '19:55 hrs', distance: '1362', halts: 20, runningDays: '1111111', classes: 'SL,3A,2A,1A' },
      { trainNumber: '12926', trainName: 'PASCHIM EXPRESS', nameHindi: 'पश्चिम एक्सप्रेस', type: 'SUPERFAST', fromCode: 'NDLS', from: 'नई दिल्ली', toCode: 'BDTS', to: 'बांद्रा टर्मिनस', departure: '16:35', arrival: '14:55', duration: '22:20 hrs', distance: '1384', halts: 28, runningDays: '1111111', classes: 'SL,3A,2A,1A' }
    ], true, { from: 'NDLS', to: 'MMCT', date: todayIso });
  });

  // Service Worker Management (Disable cache on localhost to guarantee live updates)
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
  } else if ('serviceWorker' in navigator && ['https:'].includes(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();