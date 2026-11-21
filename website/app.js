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

  // Indian Railway Standard Date Formatter: strictly DD-MM-YYYY
  function formatToDDMMYYYY(val) {
    if (!val) return '—';
    let str = String(val).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
    if (/^\d{8}$/.test(str)) return `${str.slice(0, 2)}-${str.slice(2, 4)}-${str.slice(4)}`;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str.replace(/\//g, '-');
    const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${d}-${m}-${y}`;
    }
    const dmyShortMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
    if (dmyShortMatch) {
      const d = dmyShortMatch[1].padStart(2, '0');
      const m = dmyShortMatch[2].padStart(2, '0');
      const y = `20${dmyShortMatch[3]}`;
      return `${d}-${m}-${y}`;
    }
    const monthMap = {
      'jan': '01', 'january': '01', 'जनवरी': '01',
      'feb': '02', 'february': '02', 'फरवरी': '02',
      'mar': '03', 'march': '03', 'मार्च': '03',
      'apr': '04', 'april': '04', 'अप्रैल': '04',
      'may': '05', 'मई': '05',
      'jun': '06', 'june': '06', 'जून': '06',
      'jul': '07', 'july': '07', 'जुलाई': '07',
      'aug': '08', 'august': '08', 'अगस्त': '08',
      'sep': '09', 'sept': '09', 'september': '09', 'सितंबर': '09',
      'oct': '10', 'october': '10', 'अक्टूबर': '10',
      'nov': '11', 'november': '11', 'नवंबर': '11',
      'dec': '12', 'december': '12', 'दिसंबर': '12'
    };
    const parts = str.split(/[-/.\s]+/);
    if (parts.length === 3) {
      let p0 = parts[0];
      let p1 = parts[1].toLowerCase();
      let p2 = parts[2];
      if (monthMap[p1]) {
        const d = p0.padStart(2, '0');
        const m = monthMap[p1];
        const y = p2.length === 2 ? `20${p2}` : p2;
        return `${d}-${m}-${y}`;
      }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}-${m}-${y}`;
    }
    return str;
  }

  // Setup Date Constraints
  const todayIso = indiaISO();
  
  // Live Train running date (today to 5 days ago)
  const trainDateInput = $('journey-date');
  if (trainDateInput) {
    trainDateInput.value = todayIso;
    trainDateInput.max = todayIso;
    trainDateInput.setAttribute('lang', 'en-IN');
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
      el.setAttribute('lang', 'en-IN');
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
            <span class="date-pill">यात्रा तिथि: <strong>${safe(formatToDDMMYYYY(data.journeyDate || '—'))}</strong></span>
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
            <p>${data.journeyDate ? `प्रारंभ तिथि: <strong>${safe(formatToDDMMYYYY(data.journeyDate))}</strong> | ` : ''}वर्तमान स्थिति: <strong>${safe(data.currentStation || 'मार्ग में')}</strong></p>
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
          <td><strong>${safe(formatToDDMMYYYY(item.date))}</strong></td>
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
            <p>${safe(data.from)} ➔ ${safe(data.to)} | ${data.journeyDate ? `यात्रा तिथि: <strong>${safe(formatToDDMMYYYY(data.journeyDate))}</strong> | ` : ''}क्लास: <strong>${safe(data.class || '3A')}</strong> | कोटा: <strong>${safe(data.quota || 'GN')}</strong></p>
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
            <p>${safe(data.from)} ➔ ${safe(data.to)} | ${data.journeyDate ? `यात्रा तिथि: <strong>${safe(formatToDDMMYYYY(data.journeyDate))}</strong> | ` : ''}क्लास: <strong>${safe(data.class || '3A')}</strong></p>
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
            <div class="train-booking-bar" style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;justify-content:flex-end;align-items:center;gap:12px;">
              <span style="font-size:0.75rem;color:#64748b;">Official Booking Assistance</span>
              <button type="button" class="btn-book-train" 
                      data-train="${safe(trainNo)}" 
                      data-trainname="${safe(t.trainName)}"
                      data-from="${safe(fromStn)}" 
                      data-to="${safe(toStn)}" 
                      data-date="${safe(targetDate)}"
                      style="background:#ea580c;color:#ffffff;border:none;padding:7px 18px;border-radius:6px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(234,88,12,0.3);">
                <span>Book Ticket (IRCTC Assist) ➔</span>
              </button>
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
            <p>कुल ट्रेनें: <strong>${trains.length}</strong> • यात्रा तिथि: <strong>${safe(formatToDDMMYYYY(targetDate))}</strong></p>
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

    // Attach click listeners to all Book Ticket buttons
    document.querySelectorAll('.btn-book-train').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { train, trainname, from, to, date } = btn.dataset;
        const heroCls = $('hero-class-select')?.value || '3A';
        const heroQuota = $('hero-quota-select')?.value || 'GN';
        openBookingModal({
          trainNumber: train,
          trainName: trainname,
          fromCode: from,
          toCode: to,
          date: date,
          cls: heroCls,
          quota: heroQuota,
          fare: 0
        });
      });
    });

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
        renderSeats({ ...data, journeyDate: date });
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
      renderTrain({ ...data, journeyDate: dateVal });
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
      renderFare({ ...data, journeyDate: date });
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
      journeyDate: '24-11-2026',
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
      journeyDate: '20-11-2026',
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
      journeyDate: '25-11-2026',
      class: '3A',
      quota: 'GN',
      fare: { total: 3165 },
      availability: [
        { date: '25-11-2026', status: 'AVAILABLE 0038', prediction: '94% Chance' },
        { date: '26-11-2026', status: 'AVAILABLE 0012', prediction: '88% Chance' },
        { date: '27-11-2026', status: 'RAC 08', prediction: '76% Chance' },
        { date: '28-11-2026', status: 'WL 24', prediction: '52% Chance' }
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
      journeyDate: '20-11-2026',
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

  // ==========================================================================
  // PWA App Installation & Service Worker Manager
  // ==========================================================================
  let deferredInstallPrompt = null;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function showPwaBanner() {
    if (isStandalone) return;
    if (sessionStorage.getItem('railplus_pwa_dismissed')) return;
    const banner = $('pwa-install-banner');
    if (banner) banner.hidden = false;
  }

  function hidePwaBanner() {
    const banner = $('pwa-install-banner');
    if (banner) banner.hidden = true;
    sessionStorage.setItem('railplus_pwa_dismissed', 'true');
  }

  function openPwaGuideModal() {
    const modal = $('pwa-guide-modal');
    if (modal) modal.hidden = false;
  }

  function closePwaGuideModal() {
    const modal = $('pwa-guide-modal');
    if (modal) modal.hidden = true;
  }

  // Capture native browser beforeinstallprompt event (deferred without automatic banner popup)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  // Handle Install Action
  async function triggerAppInstall() {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          hidePwaBanner();
        }
      } catch (_) {
        openPwaGuideModal();
      }
      deferredInstallPrompt = null;
    } else {
      // If browser native prompt is in cooldown or on iOS Safari, show step-by-step installation guide
      openPwaGuideModal();
    }
  }

  // Wire buttons
  $('btn-pwa-install')?.addEventListener('click', triggerAppInstall);
  $('header-install-btn')?.addEventListener('click', triggerAppInstall);
  $('btn-pwa-dismiss')?.addEventListener('click', hidePwaBanner);
  $('btn-close-pwa-modal')?.addEventListener('click', closePwaGuideModal);
  $('btn-understood-pwa')?.addEventListener('click', closePwaGuideModal);

  // Close modal when clicking on overlay background
  $('pwa-guide-modal')?.addEventListener('click', (e) => {
    if (e.target === $('pwa-guide-modal')) closePwaGuideModal();
  });

  // PWA banner is kept suppressed per user specification - only triggered on user click

  // Register Service Worker reliably for PWA installability
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          reg.update();
        })
        .catch(() => {});
    });
  }

  // ==========================================================================
  // MULTILANGUAGE LOCALIZATION (i18n): English, हिंदी, Hinglish
  // ==========================================================================
  const I18N_DICT = {
    en: {
      header_subtitle: 'IRCTC-Inspired Smart Railway Portal',
      nav_train_search: 'Train Search',
      nav_pnr: 'PNR Status',
      nav_live: 'Live Status',
      nav_passengers: 'Passenger Master',
      nav_journeys: 'Saved Journeys',
      btn_install_app: 'Install App',
      btn_dashboard: 'My Dashboard',
      hero_booking_title: 'Search & Book Trains',
      hero_badge: 'IRCTC Authorized Workflow',
      lbl_from_station: 'From Station',
      lbl_to_station: 'To Station',
      lbl_journey_date: 'Journey Date',
      chip_today: 'Today',
      chip_tomorrow: 'Tomorrow',
      chip_dayafter: 'Day After',
      date_format_subtext: 'Strictly DD-MM-YYYY',
      lbl_class: 'Class',
      opt_all_classes: 'All Classes',
      opt_class_subtext: 'SL, 3A, 2A, 1A, CC, 2S',
      lbl_quota: 'Quota',
      quota_general: 'GN - General Quota',
      quota_tatkal: 'TQ - Tatkal Quota',
      quota_ptatkal: 'PT - Premium Tatkal',
      quota_ladies: 'LD - Ladies Quota',
      quota_senior: 'SS - Senior Citizen',
      quota_divyang: 'HP - Divyangjan',
      quota_subtext: 'General, Tatkal, Ladies etc.',
      btn_search_trains: 'Search Trains',
      btn_sample_route: 'Sample Route (Demo)',
      shortcut_passengers_title: 'Passenger Master',
      shortcut_passengers_desc: 'Save & autofill co-passengers',
      shortcut_saved_title: 'Saved Journeys',
      shortcut_saved_desc: 'Quick 1-click favorite routes',
      shortcut_bookings_title: 'Booking History',
      shortcut_bookings_desc: 'Assistance & ticket records',
      shortcut_pnr_title: 'PNR & Live Status',
      shortcut_pnr_desc: 'Check live confirmation status',
      tab_pnr: 'PNR Status',
      tab_seats: 'Seat Availability (Seats)',
      tab_live: 'Live Train (Running)',
      tab_fare: 'Fare Enquiry (Fare)',
      lbl_pnr_number: '10-Digit PNR Number',
      pnr_subtext: 'Real-time chart status & passenger berths',
      btn_check_pnr: 'Check PNR Status',
      btn_demo_pnr: 'Sample PNR (Demo)',
      lbl_train_optional: 'Train Number (Optional)',
      btn_check_seats: 'Check Seat Availability',
      btn_demo_seats: 'Sample Seats (Demo)',
      lbl_train_num_name: 'Train Number / Name',
      lbl_start_date: 'Train Start Date',
      train_date_subtext: 'Today or up to 5 days back',
      btn_track_train: 'Track Live Train',
      btn_demo_train: 'Sample Train (Demo)',
      lbl_train_number: 'Train Number',
      btn_check_fare: 'Check Fare Table',
      btn_demo_fare: 'Sample Fare (Demo)',
      info_heading: 'Important Indian Railways Info & Assistance Guidelines',
      info_pnr_title: 'PNR Status Codes & Meanings',
      info_cnf: 'Confirmed booking with allotted coach and berth number.',
      info_rac: 'Reservation Against Cancellation — guaranteed travel boarding.',
      info_wl: 'Waiting List ticket — confirmable upon cancellation of others.',
      info_tq: 'Tatkal waiting list (zero refund upon cancellation if confirmed).',
      info_chart_title: 'Chart Preparation Timeline',
      info_first_chart: 'Prepared approximately 4 hours prior to train departure.',
      info_second_chart: 'Final chart prepared ~30 minutes prior from charting station.',
      info_helpline: 'Railway Helpline: 139 | Medical & Security Emergency',
      info_official: 'Authorized Partner Workflow: Prepares journey & hands off to IRCTC portal.',
      booking_modal_title: 'RailPlus Booking Assistance',
      step_train: '1. Train Info',
      step_passengers: '2. Passengers',
      step_review: '3. Review',
      step_irctc: '4. IRCTC Handoff',
      select_passengers_title: 'Select Passengers for this Booking',
      btn_add_new_passenger: '+ Add New Passenger',
      quick_add_title: 'Quick Add Passenger',
      btn_cancel: 'Cancel',
      btn_save_pax: 'Save Passenger',
      irctc_assist_heading: 'RailPlus Booking Assistance (Official IRCTC Handoff)',
      irctc_assist_desc: 'RailPlus prepares your journey details cleanly. In compliance with railway regulations, click below to copy passenger details and complete your confirmed booking on the official IRCTC portal without solving automated CAPTCHA restrictions.',
      btn_copy_pax: 'Copy Passenger Details 📋',
      btn_proceed_irctc: 'Proceed to Official IRCTC (irctc.co.in) ➔',
      btn_back: 'Back',
      btn_review_continue: 'Continue to Review ➔',
      passenger_master_title: 'Passenger Master Management',
      add_passenger_heading: 'Add New Saved Passenger',
      lbl_pax_name: 'Full Name (as per Govt ID)',
      lbl_pax_age: 'Age (Years)',
      lbl_pax_gender: 'Gender',
      gender_male: 'Male (पुरुष)',
      gender_female: 'Female (महिला)',
      gender_trans: 'Transgender',
      lbl_pax_berth: 'Berth Preference',
      lbl_pax_food: 'Food Preference',
      food_veg: 'Vegetarian (शाकाहारी)',
      food_nonveg: 'Non-Vegetarian (मांसाहारी)',
      food_none: 'No Food (कोई भोजन नहीं)',
      lbl_pax_nickname: 'Optional Nickname (e.g. Papa, Sister)',
      btn_save_passenger_master: 'Save Passenger Details',
      saved_passengers_list_title: 'Your Saved Passengers List',
      saved_journeys_title: 'Saved Journeys & Station Master',
      saved_journeys_intro: 'Save frequently used train routes for instantaneous 1-click search.',
      add_favorite_route_title: 'Add Favorite Route',
      btn_add_favorite_route: 'Save This Route',
      dashboard_title: 'RailPlus User Dashboard',
      stat_passengers: 'Saved Passengers',
      stat_routes: 'Saved Routes',
      stat_bookings: 'Booking Records',
      menu_passengers: 'Passenger Master',
      menu_journeys: 'Saved Journeys & Routes',
      menu_history: 'Booking Assistance History',
      menu_install_app: 'Install RailPlus PWA App',
      menu_clear_data: 'Reset / Clear All Saved Data',
      footer_desc: 'Smart, IRCTC-inspired railway journey planning and booking assistance platform.',
      footer_useful_links: 'Useful Links',
      footer_helpline_security: 'Helpline & Security',
      footer_helpline: 'Railway Helpline: 139',
      footer_privacy: 'Privacy & Security: No Aadhaar or IRCTC passwords stored.',
      footer_encryption: 'Local storage security with private user sandboxing.',
      install_app_title: 'Install RailPlus App',
      install_step_1_title: 'Open Browser Menu',
      install_step_1_desc: 'Tap the three dots (⋮) in Chrome or the Share button in Safari.',
      install_step_2_title: 'Select Install or Add to Home',
      install_step_2_desc: 'Choose "Install RailPlus" or "Add to Home Screen".',
      install_step_3_title: 'Enjoy Native App Experience',
      install_step_3_desc: 'Launch RailPlus from your home screen with zero repeated banners.',
      btn_got_it: 'Got it'
    },
    hi: {
      header_subtitle: 'IRCTC-प्रेरित स्मार्ट रेलवे बुकिंग पोर्टल',
      nav_train_search: 'ट्रेन खोजें',
      nav_pnr: 'PNR स्थिति',
      nav_live: 'लाइव स्टेटस',
      nav_passengers: 'यात्री मास्टर',
      nav_journeys: 'सेव यात्राएं',
      btn_install_app: 'ऐप इंस्टॉल करें',
      btn_dashboard: 'मेरा डैशबोर्ड',
      hero_booking_title: 'ट्रेन खोजें एवं यात्रा प्लान करें',
      hero_badge: 'IRCTC प्राधिकृत कार्यप्रवाह',
      lbl_from_station: 'कहाँ से (From Station)',
      lbl_to_station: 'कहाँ तक (To Station)',
      lbl_journey_date: 'यात्रा तिथि (Journey Date)',
      chip_today: 'आज',
      chip_tomorrow: 'कल',
      chip_dayafter: 'परसों',
      date_format_subtext: 'हमेशा DD-MM-YYYY प्रारूप',
      lbl_class: 'क्लास (Class)',
      opt_all_classes: 'सभी क्लास (All Classes)',
      opt_class_subtext: 'SL, 3A, 2A, 1A, CC, 2S',
      lbl_quota: 'कोटा (Quota)',
      quota_general: 'GN - सामान्य कोटा',
      quota_tatkal: 'TQ - तत्काल कोटा',
      quota_ptatkal: 'PT - प्रीमियम तत्काल',
      quota_ladies: 'LD - महिला कोटा',
      quota_senior: 'SS - वरिष्ठ नागरिक',
      quota_divyang: 'HP - दिव्यांगजन',
      quota_subtext: 'सामान्य, तत्काल, महिला इत्यादि',
      btn_search_trains: 'ट्रेन खोजें',
      btn_sample_route: 'सैंपल रूट (डेमो)',
      shortcut_passengers_title: 'यात्री मास्टर',
      shortcut_passengers_desc: 'सह-यात्रियों की जानकारी सुरक्षित रखें',
      shortcut_saved_title: 'सेव यात्राएं',
      shortcut_saved_desc: '1-क्लिक पसंदीदा ट्रेन रूट',
      shortcut_bookings_title: 'बुकिंग इतिहास',
      shortcut_bookings_desc: 'असिस्टेंस व टिकट रिकॉर्ड्स',
      shortcut_pnr_title: 'PNR व लाइव स्थिति',
      shortcut_pnr_desc: 'कन्फर्मेशन व सीट स्थिति जांचें',
      tab_pnr: 'PNR स्थिति',
      tab_seats: 'सीट उपलब्धता (Seats)',
      tab_live: 'लाइव ट्रेन (Running)',
      tab_fare: 'किराया सूची (Fare)',
      lbl_pnr_number: '10-अंकों का PNR नंबर',
      pnr_subtext: 'रीयल-टाइम चार्ट स्थिति एवं बर्थ विवरण',
      btn_check_pnr: 'PNR स्थिति जांचें',
      btn_demo_pnr: 'सैंपल PNR (डेमो)',
      lbl_train_optional: 'ट्रेन नंबर (वैकल्पिक)',
      btn_check_seats: 'सीट उपलब्धता देखें',
      btn_demo_seats: 'सैंपल सीट (डेमो)',
      lbl_train_num_name: 'ट्रेन नंबर या नाम',
      lbl_start_date: 'ट्रेन शुरुआत तिथि',
      train_date_subtext: 'आज या पिछले 5 दिनों तक',
      btn_track_train: 'लाइव ट्रेन ट्रैक करें',
      btn_demo_train: 'सैंपल ट्रेन (डेमो)',
      lbl_train_number: 'ट्रेन नंबर',
      btn_check_fare: 'किराया देखें',
      btn_demo_fare: 'सैंपल किराया (डेमो)',
      info_heading: 'महत्वपूर्ण भारतीय रेल जानकारी एवं बुकिंग सहायता',
      info_pnr_title: 'PNR स्थिति कोड का अर्थ',
      info_cnf: 'कन्फर्म बुकिंग — कोच एवं बर्थ नंबर आवंटित।',
      info_rac: 'आरएसी — ट्रेन में यात्रा करने की गारंटीकृत सुविधा।',
      info_wl: 'वेटिंग लिस्ट — अन्य टिकट रद्द होने पर कन्फर्म होगी।',
      info_tq: 'तत्काल वेटिंग लिस्ट (कन्फर्म होने पर शून्य रिफंड)।',
      info_chart_title: 'चार्ट बनने का समय',
      info_first_chart: 'ट्रेन प्रस्थान से लगभग 4 घंटे पूर्व पहला चार्ट बनता है।',
      info_second_chart: 'चार्टिंग स्टेशन से प्रस्थान से 30 मिनट पूर्व अंतिम चार्ट।',
      info_helpline: 'रेलवे हेल्पलाइन: 139 | चिकित्सा एवं सुरक्षा आपातकाल',
      info_official: 'सहायता कार्यप्रवाह: यात्रा विवरण तैयार कर आधिकारिक IRCTC पोर्टल पर भेजता है।',
      booking_modal_title: 'RailPlus बुकिंग सहायता',
      step_train: '1. ट्रेन विवरण',
      step_passengers: '2. यात्री चयन',
      step_review: '3. समीक्षा',
      step_irctc: '4. IRCTC रीडायरेक्ट',
      select_passengers_title: 'इस बुकिंग के लिए यात्री चुनें',
      btn_add_new_passenger: '+ नया यात्री जोड़ें',
      quick_add_title: 'त्वरित यात्री जोड़ें',
      btn_cancel: 'रद्द करें',
      btn_save_pax: 'यात्री सेव करें',
      irctc_assist_heading: 'RailPlus बुकिंग सहायता (आधिकारिक IRCTC रीडायरेक्ट)',
      irctc_assist_desc: 'RailPlus आपके यात्रा व यात्री विवरण तैयार रखता है। रेलवे नियमों का पालन करते हुए बिना किसी फर्जी टिकट के आधिकारिक IRCTC पोर्टल पर अपनी टिकट सुरक्षित बुक करें।',
      btn_copy_pax: 'यात्री विवरण कॉपी करें 📋',
      btn_proceed_irctc: 'आधिकारिक IRCTC पोर्टल पर जाएं ➔',
      btn_back: 'पीछे जाएं',
      btn_review_continue: 'समीक्षा के लिए आगे बढ़ें ➔',
      passenger_master_title: 'यात्री मास्टर प्रबंधन',
      add_passenger_heading: 'नया यात्री सेव करें',
      lbl_pax_name: 'पूरा नाम (पहचान पत्र अनुसार)',
      lbl_pax_age: 'आयु (वर्ष)',
      lbl_pax_gender: 'लिंग',
      gender_male: 'पुरुष (Male)',
      gender_female: 'महिला (Female)',
      gender_trans: 'ट्रांसजेंडर (Transgender)',
      lbl_pax_berth: 'बर्थ प्राथमिकता',
      lbl_pax_food: 'भोजन प्राथमिकता',
      food_veg: 'शाकाहारी (Veg)',
      food_nonveg: 'मांसाहारी (Non-Veg)',
      food_none: 'कोई भोजन नहीं (No Food)',
      lbl_pax_nickname: 'उपनाम (वैकल्पिक उदा. पापा, दीदी)',
      btn_save_passenger_master: 'यात्री मास्टर में सेव करें',
      saved_passengers_list_title: 'आपके सेव किए गए यात्री',
      saved_journeys_title: 'सेव यात्राएं एवं स्टेशन मास्टर',
      saved_journeys_intro: 'बार-बार उपयोग होने वाले रूट सेव करें और 1-क्लिक में ट्रेन खोजें।',
      add_favorite_route_title: 'पसंदीदा रूट जोड़ें',
      btn_add_favorite_route: 'यह रूट सेव करें',
      dashboard_title: 'RailPlus यूज़र डैशबोर्ड',
      stat_passengers: 'सेव यात्री',
      stat_routes: 'सेव रूट',
      stat_bookings: 'बुकिंग रिकॉर्ड',
      menu_passengers: 'यात्री मास्टर (Passenger Master)',
      menu_journeys: 'सेव यात्राएं (Saved Journeys)',
      menu_history: 'बुकिंग इतिहास (Booking History)',
      menu_install_app: 'RailPlus ऐप इंस्टॉल करें',
      menu_clear_data: 'डेटा रीसेट / साफ़ करें',
      footer_desc: 'IRCTC-प्रेरित स्मार्ट रेलवे यात्रा प्लानिंग एवं बुकिंग सहायता मंच।',
      footer_useful_links: 'महत्वपूर्ण लिंक्स',
      footer_helpline_security: 'सुरक्षा एवं सहायता',
      footer_helpline: 'रेलवे हेल्पलाइन: 139',
      footer_privacy: 'गोपनीयता: कोई आधार या IRCTC पासवर्ड सेव नहीं किया जाता।',
      footer_encryption: 'निजी ब्राउज़र स्थानीय स्टोरेज सुरक्षा।',
      install_app_title: 'RailPlus ऐप इंस्टॉल करें',
      install_step_1_title: 'ब्राउज़र मेन्यू खोलें',
      install_step_1_desc: 'Chrome में तीन बिंदु (⋮) या Safari में Share बटन दबाएं।',
      install_step_2_title: 'होम स्क्रीन में जोड़ें चुनें',
      install_step_2_desc: '"Install RailPlus" या "Add to Home Screen" चुनें।',
      install_step_3_title: 'नेगटिव ऐप की तरह चलाएं',
      install_step_3_desc: 'बिना किसी रुकावट या बार-बार बैनर के अपनी होम स्क्रीन से ऐप खोलें।',
      btn_got_it: 'समझ गया'
    },
    hinglish: {
      header_subtitle: 'IRCTC-Inspired Smart Railway Portal',
      nav_train_search: 'Train Search',
      nav_pnr: 'PNR Status',
      nav_live: 'Live Status',
      nav_passengers: 'Passenger Master',
      nav_journeys: 'Saved Journeys',
      btn_install_app: 'App Install Karein',
      btn_dashboard: 'Mera Dashboard',
      hero_booking_title: 'Train Khojein & Book Karein',
      hero_badge: 'IRCTC Authorized Workflow',
      lbl_from_station: 'Kahan Se (From)',
      lbl_to_station: 'Kahan Tak (To)',
      lbl_journey_date: 'Journey Date',
      chip_today: 'Aaj',
      chip_tomorrow: 'Kal',
      chip_dayafter: 'Parson',
      date_format_subtext: 'Strictly DD-MM-YYYY format',
      lbl_class: 'Class Select Karein',
      opt_all_classes: 'Sabhi Classes (All)',
      opt_class_subtext: 'SL, 3A, 2A, 1A, CC, 2S',
      lbl_quota: 'Quota Select Karein',
      quota_general: 'GN - General Quota',
      quota_tatkal: 'TQ - Tatkal Quota',
      quota_ptatkal: 'PT - Premium Tatkal',
      quota_ladies: 'LD - Ladies Quota',
      quota_senior: 'SS - Senior Citizen',
      quota_divyang: 'HP - Divyangjan',
      quota_subtext: 'General, Tatkal, Ladies etc.',
      btn_search_trains: 'Train Search Karein',
      btn_sample_route: 'Sample Route (Demo)',
      shortcut_passengers_title: 'Saved Passengers',
      shortcut_passengers_desc: 'Passengers details save & autofill',
      shortcut_saved_title: 'Saved Journeys',
      shortcut_saved_desc: '1-click favorite train routes',
      shortcut_bookings_title: 'Booking History',
      shortcut_bookings_desc: 'Assistance & ticket records',
      shortcut_pnr_title: 'PNR & Live Status',
      shortcut_pnr_desc: 'Check live confirmation status',
      tab_pnr: 'PNR Status',
      tab_seats: 'Seat Availability (Seats)',
      tab_live: 'Live Train (Running)',
      tab_fare: 'Fare Enquiry (Fare)',
      lbl_pnr_number: '10-Digit PNR Number',
      pnr_subtext: 'Real-time chart status & passenger berths',
      btn_check_pnr: 'PNR Status Check Karein',
      btn_demo_pnr: 'Sample PNR (Demo)',
      lbl_train_optional: 'Train Number (Optional)',
      btn_check_seats: 'Seat Availability Dekhein',
      btn_demo_seats: 'Sample Seats (Demo)',
      lbl_train_num_name: 'Train Number / Name',
      lbl_start_date: 'Train Start Date',
      train_date_subtext: 'Aaj ya 5 days pehle tak',
      btn_track_train: 'Live Train Track Karein',
      btn_demo_train: 'Sample Train (Demo)',
      lbl_train_number: 'Train Number',
      btn_check_fare: 'Fare Table Dekhein',
      btn_demo_fare: 'Sample Fare (Demo)',
      info_heading: 'Important Indian Railways Info & Assistance Guidelines',
      info_pnr_title: 'PNR Status Codes & Meanings',
      info_cnf: 'Confirmed booking with allotted coach and berth number.',
      info_rac: 'RAC — Boarding & travel guaranteed on train.',
      info_wl: 'Waiting List ticket — confirm hogi cancellation hone par.',
      info_tq: 'Tatkal waiting list (zero refund upon cancellation if confirmed).',
      info_chart_title: 'Chart Preparation Timeline',
      info_first_chart: 'Train departure se approx 4 hours pehle first chart banta hai.',
      info_second_chart: 'Charting station se departure se ~30 min pehle final chart.',
      info_helpline: 'Railway Helpline: 139 | Medical & Security Emergency',
      info_official: 'Authorized Partner Workflow: Prepares journey & hands off to IRCTC portal.',
      booking_modal_title: 'RailPlus Booking Assistance',
      step_train: '1. Train Info',
      step_passengers: '2. Passengers',
      step_review: '3. Review',
      step_irctc: '4. IRCTC Handoff',
      select_passengers_title: 'Is booking ke liye passengers select karein',
      btn_add_new_passenger: '+ Naya Passenger Add Karein',
      quick_add_title: 'Quick Add Passenger',
      btn_cancel: 'Cancel',
      btn_save_pax: 'Passenger Save Karein',
      irctc_assist_heading: 'RailPlus Booking Assistance (Official IRCTC Handoff)',
      irctc_assist_desc: 'RailPlus aapki journey details ready rakhta hai. Official IRCTC portal par jaakar direct confirmed booking complete karein.',
      btn_copy_pax: 'Passenger Details Copy Karein 📋',
      btn_proceed_irctc: 'Official IRCTC (irctc.co.in) par jayein ➔',
      btn_back: 'Peeche Jayein',
      btn_review_continue: 'Review ke liye Aage Badhein ➔',
      passenger_master_title: 'Passenger Master Management',
      add_passenger_heading: 'Naya Passenger Save Karein',
      lbl_pax_name: 'Poora Naam (Govt ID ke mutabiq)',
      lbl_pax_age: 'Umar / Age (Years)',
      lbl_pax_gender: 'Gender',
      gender_male: 'Male (Purush)',
      gender_female: 'Female (Mahila)',
      gender_trans: 'Transgender',
      lbl_pax_berth: 'Berth Preference',
      lbl_pax_food: 'Food Preference',
      food_veg: 'Vegetarian (Shakahari)',
      food_nonveg: 'Non-Vegetarian (Mansahari)',
      food_none: 'No Food',
      lbl_pax_nickname: 'Optional Nickname (e.g. Papa, Bhai)',
      btn_save_passenger_master: 'Passenger Master me Save Karein',
      saved_passengers_list_title: 'Aapke Saved Passengers',
      saved_journeys_title: 'Saved Journeys & Station Master',
      saved_journeys_intro: 'Frequently used train routes save karein aur 1-click me train search karein.',
      add_favorite_route_title: 'Favorite Route Add Karein',
      btn_add_favorite_route: 'Ye Route Save Karein',
      dashboard_title: 'RailPlus User Dashboard',
      stat_passengers: 'Saved Passengers',
      stat_routes: 'Saved Routes',
      stat_bookings: 'Booking Records',
      menu_passengers: 'Passenger Master',
      menu_journeys: 'Saved Journeys & Routes',
      menu_history: 'Booking History',
      menu_install_app: 'Install RailPlus App',
      menu_clear_data: 'Reset / Sabhi Data Clear Karein',
      footer_desc: 'Smart, IRCTC-inspired railway journey planning and booking assistance platform.',
      footer_useful_links: 'Useful Links',
      footer_helpline_security: 'Helpline & Security',
      footer_helpline: 'Railway Helpline: 139',
      footer_privacy: 'Privacy: Koi Aadhaar ya IRCTC password save nahi hota.',
      footer_encryption: 'Local storage security with private user sandboxing.',
      install_app_title: 'RailPlus App Install Karein',
      install_step_1_title: 'Browser Menu Kholein',
      install_step_1_desc: 'Chrome me 3 dots (⋮) ya Safari me Share dabayein.',
      install_step_2_title: 'Add to Home Screen Chunein',
      install_step_2_desc: '"Install RailPlus" ya "Add to Home Screen" select karein.',
      install_step_3_title: 'Native App Jaisa Chalayein',
      install_step_3_desc: 'Bina kisi popup ke direct home screen se open karein.',
      btn_got_it: 'Theek Hai (Got it)'
    }
  };

  function setLanguage(lang) {
    const activeLang = I18N_DICT[lang] ? lang : 'en';
    const dict = I18N_DICT[activeLang];
    localStorage.setItem('railplus_lang', activeLang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (key === 'ph_from_station') {
        el.placeholder = activeLang === 'hi' ? 'उदा. NDLS (नई दिल्ली)' : (activeLang === 'hinglish' ? 'Jaise NDLS (New Delhi)' : 'e.g. NDLS (New Delhi)');
      } else if (key === 'ph_to_station') {
        el.placeholder = activeLang === 'hi' ? 'उदा. MMCT (मुंबई सेंट्रल)' : (activeLang === 'hinglish' ? 'Jaise MMCT (Mumbai Central)' : 'e.g. MMCT (Mumbai Central)');
      }
    });

    const selector = $('lang-selector');
    if (selector && selector.value !== activeLang) {
      selector.value = activeLang;
    }
  }

  // Setup Language Selector
  const savedLang = localStorage.getItem('railplus_lang') || 'en';
  setLanguage(savedLang);
  $('lang-selector')?.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  // ==========================================================================
  // DARK / LIGHT THEME TOGGLE
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('railplus_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleBtn(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('railplus_theme', nextTheme);
    updateThemeToggleBtn(nextTheme);
  }

  function updateThemeToggleBtn(theme) {
    const btn = $('btn-theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  initTheme();
  $('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // ==========================================================================
  // HERO CONTROLS: Station Swap, Quick Date Chips
  // ==========================================================================
  $('btn-hero-swap-stations')?.addEventListener('click', () => {
    const fromEl = $('route-from-input');
    const toEl = $('route-to-input');
    if (!fromEl || !toEl) return;

    const tmpVal = fromEl.value;
    const tmpCode = fromEl.dataset.code || '';
    fromEl.value = toEl.value;
    fromEl.dataset.code = toEl.dataset.code || '';
    toEl.value = tmpVal;
    toEl.dataset.code = tmpCode;
  });

  function setHeroDateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = indiaISO(d);
    const dateInput = $('route-date-input');
    if (dateInput) {
      dateInput.value = dateStr;
    }
    // Update active class on chips
    $('chip-date-today')?.classList.toggle('active', days === 0);
    $('chip-date-tomorrow')?.classList.toggle('active', days === 1);
    $('chip-date-dayafter')?.classList.toggle('active', days === 2);
  }

  $('chip-date-today')?.addEventListener('click', () => setHeroDateOffset(0));
  $('chip-date-tomorrow')?.addEventListener('click', () => setHeroDateOffset(1));
  $('chip-date-dayafter')?.addEventListener('click', () => setHeroDateOffset(2));

  // ==========================================================================
  // PASSENGER MASTER MANAGEMENT (CRUD + Local Storage Sandboxing)
  // ==========================================================================
  const PASSENGER_STORAGE_KEY = 'railplus_passengers';

  function getSavedPassengers() {
    try {
      const data = localStorage.getItem(PASSENGER_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  function savePassengerList(list) {
    try {
      localStorage.setItem(PASSENGER_STORAGE_KEY, JSON.stringify(list));
      updateDashboardStats();
    } catch (_) {}
  }

  function renderPassengerMasterList() {
    const listEl = $('passenger-master-list');
    if (!listEl) return;
    const passengers = getSavedPassengers();

    if (passengers.length === 0) {
      listEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">No passengers saved yet. Add your family or co-passengers above.</p>';
      return;
    }

    listEl.innerHTML = passengers.map(p => {
      const genderLabel = p.gender === 'F' ? 'Female (F)' : (p.gender === 'T' ? 'Transgender (T)' : 'Male (M)');
      const isSenior = Number(p.age) >= 60;
      return `
        <div class="passenger-card" data-pax-id="${safe(p.id)}" style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:1rem;color:#0f294a;">
              ${safe(p.name)} 
              ${p.nickname ? `<span style="font-size:0.8rem;color:#64748b;font-weight:normal;">(${safe(p.nickname)})</span>` : ''}
              ${isSenior ? '<span class="card-badge" style="background:#fef3c7;color:#92400e;font-size:0.65rem;margin-left:6px;">Senior Citizen</span>' : ''}
            </div>
            <div style="font-size:0.8rem;color:#475569;margin-top:2px;">
              Age: ${safe(p.age)} • ${safe(genderLabel)} • Berth: ${safe(p.berth || 'No Preference')} • Food: ${safe(p.food || 'None')}
            </div>
          </div>
          <div>
            <button type="button" class="btn-delete-pax" data-id="${safe(p.id)}" style="background:#fee2e2;color:#b91c1c;border:none;padding:6px 12px;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:600;">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-delete-pax').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        deletePassengerMaster(id);
      });
    });
  }

  function deletePassengerMaster(id) {
    const list = getSavedPassengers().filter(p => p.id !== id);
    savePassengerList(list);
    renderPassengerMasterList();
  }

  $('passenger-master-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = ($('pm-name')?.value || '').trim();
    const age = Number($('pm-age')?.value || 0);
    const gender = $('pm-gender')?.value || 'M';
    const berth = $('pm-berth')?.value || 'No Preference';
    const food = $('pm-food')?.value || 'Veg';
    const nickname = ($('pm-nickname')?.value || '').trim();

    if (!name || name.length < 2) {
      alert('Please enter a valid passenger name.');
      return;
    }
    if (!age || age < 1 || age > 125) {
      alert('Please enter a valid passenger age (1-125).');
      return;
    }

    const currentList = getSavedPassengers();
    const exists = currentList.some(p => p.name.toLowerCase() === name.toLowerCase() && Number(p.age) === age);
    if (exists) {
      alert('A passenger with this name and age is already saved.');
      return;
    }

    const newPax = {
      id: 'pax_' + Date.now(),
      name,
      age,
      gender,
      berth,
      food,
      nickname,
      createdAt: new Date().toISOString()
    };

    currentList.push(newPax);
    savePassengerList(currentList);
    $('passenger-master-form').reset();
    renderPassengerMasterList();
  });

  // Wire Passenger Master Modal Open/Close
  function openPassengerModal() {
    renderPassengerMasterList();
    const modal = $('passenger-master-modal');
    if (modal) modal.hidden = false;
  }
  function closePassengerModal() {
    const modal = $('passenger-master-modal');
    if (modal) modal.hidden = true;
  }
  $('nav-btn-passengers')?.addEventListener('click', openPassengerModal);
  $('btn-shortcut-passengers')?.addEventListener('click', openPassengerModal);
  $('dash-menu-passengers')?.addEventListener('click', () => { closeDashboardModal(); openPassengerModal(); });
  $('btn-close-passenger-modal')?.addEventListener('click', closePassengerModal);
  $('passenger-master-modal')?.addEventListener('click', (e) => {
    if (e.target === $('passenger-master-modal')) closePassengerModal();
  });

  // ==========================================================================
  // STATION & JOURNEY MASTER (Favorites / Quick Routes)
  // ==========================================================================
  const JOURNEYS_STORAGE_KEY = 'railplus_saved_journeys';
  const DEFAULT_JOURNEYS = [
    { id: 'j_1', fromCode: 'ADI', fromName: 'Ahmedabad Jn (ADI)', toCode: 'LKO', toName: 'Lucknow Jn (LKO)' },
    { id: 'j_2', fromCode: 'NDLS', fromName: 'New Delhi (NDLS)', toCode: 'MMCT', toName: 'Mumbai Central (MMCT)' },
    { id: 'j_3', fromCode: 'HWH', fromName: 'Howrah Jn (HWH)', toCode: 'NDLS', toName: 'New Delhi (NDLS)' }
  ];

  function getSavedJourneys() {
    try {
      const data = localStorage.getItem(JOURNEYS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(JOURNEYS_STORAGE_KEY, JSON.stringify(DEFAULT_JOURNEYS));
        return DEFAULT_JOURNEYS;
      }
      return JSON.parse(data);
    } catch (_) {
      return DEFAULT_JOURNEYS;
    }
  }

  function saveJourneysList(list) {
    try {
      localStorage.setItem(JOURNEYS_STORAGE_KEY, JSON.stringify(list));
      updateDashboardStats();
    } catch (_) {}
  }

  function renderSavedJourneysList() {
    const listEl = $('saved-journeys-list');
    if (!listEl) return;
    const journeys = getSavedJourneys();

    if (journeys.length === 0) {
      listEl.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">No saved routes. Add your favorite routes above.</p>';
      return;
    }

    listEl.innerHTML = journeys.map(j => {
      return `
        <div class="saved-journey-item" style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:1rem;color:#0f294a;">
              ${safe(j.fromCode)} ➔ ${safe(j.toCode)}
            </div>
            <div style="font-size:0.8rem;color:#475569;margin-top:2px;">
              ${safe(j.fromName)} to ${safe(j.toName)}
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button type="button" class="btn-use-journey" data-from="${safe(j.fromCode)}" data-to="${safe(j.toCode)}" data-fromname="${safe(j.fromName)}" data-toname="${safe(j.toName)}" style="background:#ea580c;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:0.85rem;cursor:pointer;font-weight:600;">
              Use Route ➔
            </button>
            <button type="button" class="btn-delete-journey" data-id="${safe(j.id)}" style="background:#fee2e2;color:#b91c1c;border:none;padding:6px 10px;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:600;">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-use-journey').forEach(btn => {
      btn.addEventListener('click', () => {
        const fromCode = btn.dataset.from;
        const toCode = btn.dataset.to;
        const fromName = btn.dataset.fromname;
        const toName = btn.dataset.toname;

        const fromInput = $('route-from-input');
        const toInput = $('route-to-input');
        if (fromInput) {
          fromInput.value = fromName || fromCode;
          fromInput.dataset.code = fromCode;
        }
        if (toInput) {
          toInput.value = toName || toCode;
          toInput.dataset.code = toCode;
        }
        closeJourneysModal();
        $('btn-submit-route')?.click();
      });
    });

    listEl.querySelectorAll('.btn-delete-journey').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const list = getSavedJourneys().filter(j => j.id !== id);
        saveJourneysList(list);
        renderSavedJourneysList();
      });
    });
  }

  $('add-journey-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fromVal = ($('add-route-from')?.value || '').trim().toUpperCase();
    const toVal = ($('add-route-to')?.value || '').trim().toUpperCase();

    if (!fromVal || !toVal || fromVal === toVal) {
      alert('Please enter different From and To station codes.');
      return;
    }

    const currentList = getSavedJourneys();
    const newJourney = {
      id: 'j_' + Date.now(),
      fromCode: fromVal,
      fromName: fromVal,
      toCode: toVal,
      toName: toVal
    };
    currentList.push(newJourney);
    saveJourneysList(currentList);
    $('add-journey-form').reset();
    renderSavedJourneysList();
  });

  function openJourneysModal() {
    renderSavedJourneysList();
    const modal = $('saved-journeys-modal');
    if (modal) modal.hidden = false;
  }
  function closeJourneysModal() {
    const modal = $('saved-journeys-modal');
    if (modal) modal.hidden = true;
  }
  $('nav-btn-journeys')?.addEventListener('click', openJourneysModal);
  $('btn-shortcut-saved')?.addEventListener('click', openJourneysModal);
  $('dash-menu-journeys')?.addEventListener('click', () => { closeDashboardModal(); openJourneysModal(); });
  $('btn-close-journeys-modal')?.addEventListener('click', closeJourneysModal);
  $('saved-journeys-modal')?.addEventListener('click', (e) => {
    if (e.target === $('saved-journeys-modal')) closeJourneysModal();
  });

  // ==========================================================================
  // USER DASHBOARD MODAL
  // ==========================================================================
  function updateDashboardStats() {
    const paxCount = getSavedPassengers().length;
    const routesCount = getSavedJourneys().length;
    const bookingCount = getBookingHistory().length;

    const elPax = $('dash-stat-passengers');
    const elRoutes = $('dash-stat-routes');
    const elBookings = $('dash-stat-bookings');
    if (elPax) elPax.textContent = String(paxCount);
    if (elRoutes) elRoutes.textContent = String(routesCount);
    if (elBookings) elBookings.textContent = String(bookingCount);
  }

  function openDashboardModal() {
    updateDashboardStats();
    const modal = $('user-dashboard-modal');
    if (modal) modal.hidden = false;
  }
  function closeDashboardModal() {
    const modal = $('user-dashboard-modal');
    if (modal) modal.hidden = true;
  }
  $('btn-open-dashboard')?.addEventListener('click', openDashboardModal);
  $('btn-mobile-menu')?.addEventListener('click', openDashboardModal);
  $('btn-shortcut-bookings')?.addEventListener('click', () => {
    openDashboardModal();
  });
  $('btn-close-dashboard-modal')?.addEventListener('click', closeDashboardModal);
  $('user-dashboard-modal')?.addEventListener('click', (e) => {
    if (e.target === $('user-dashboard-modal')) closeDashboardModal();
  });

  $('dash-menu-history')?.addEventListener('click', () => {
    const history = getBookingHistory();
    if (history.length === 0) {
      alert('No booking assistance history yet. Search trains and click Book to start.');
      return;
    }
    const txt = history.map((h, i) => `${i+1}. ${h.trainNumber} (${h.fromCode} ➔ ${h.toCode}) on ${h.date} - ${h.passengers.length} passenger(s)`).join('\\n');
    alert('Your Booking Assistance History:\\n\\n' + txt);
  });

  $('dash-menu-clear')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all your saved passengers, routes, and history? This cannot be undone.')) {
      localStorage.removeItem(PASSENGER_STORAGE_KEY);
      localStorage.removeItem(JOURNEYS_STORAGE_KEY);
      localStorage.removeItem('railplus_booking_history');
      updateDashboardStats();
      alert('All local saved data cleared successfully.');
    }
  });

  // ==========================================================================
  // BOOKING ASSISTANCE WORKFLOW & OFFICIAL IRCTC HANDOFF
  // ==========================================================================
  let activeBooking = null;
  let activeBookingStep = 1;

  function getBookingHistory() {
    try {
      const data = localStorage.getItem('railplus_booking_history');
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  function saveBookingRecord(record) {
    try {
      const history = getBookingHistory();
      history.unshift(record);
      if (history.length > 20) history.pop();
      localStorage.setItem('railplus_booking_history', JSON.stringify(history));
      updateDashboardStats();
    } catch (_) {}
  }

  function openBookingModal(journeyData) {
    activeBooking = {
      trainNumber: journeyData.trainNumber,
      trainName: journeyData.trainName,
      fromCode: journeyData.fromCode,
      toCode: journeyData.toCode,
      date: journeyData.date,
      cls: journeyData.cls,
      quota: journeyData.quota || 'GN',
      farePerPax: Number(journeyData.fare || 0),
      selectedPassengers: []
    };
    activeBookingStep = 2; // Directly to passengers selection for speed!
    renderBookingStep();
    const modal = $('booking-flow-modal');
    if (modal) modal.hidden = false;
  }

  function closeBookingModal() {
    const modal = $('booking-flow-modal');
    if (modal) modal.hidden = true;
    activeBooking = null;
  }

  $('btn-close-booking-modal')?.addEventListener('click', closeBookingModal);
  $('booking-flow-modal')?.addEventListener('click', (e) => {
    if (e.target === $('booking-flow-modal')) closeBookingModal();
  });

  function renderBookingStep() {
    if (!activeBooking) return;

    // Update Step Indicators
    ['bstep-1', 'bstep-2', 'bstep-3', 'bstep-4'].forEach((stepId, idx) => {
      const el = $(stepId);
      if (!el) return;
      el.classList.toggle('active', (idx + 1) === activeBookingStep);
      el.classList.toggle('completed', (idx + 1) < activeBookingStep);
    });

    // Populate Train Summary
    const trainInfoEl = $('booking-train-summary');
    if (trainInfoEl) {
      trainInfoEl.innerHTML = `
        <div style="background:#f1f5f9;border-left:4px solid #ea580c;padding:12px 16px;border-radius:6px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-weight:700;color:#0f294a;font-size:1.05rem;">
              ${safe(activeBooking.trainNumber)} — ${safe(activeBooking.trainName)}
            </div>
            <div style="font-size:0.85rem;color:#475569;margin-top:2px;">
              Route: <strong>${safe(activeBooking.fromCode)}</strong> ➔ <strong>${safe(activeBooking.toCode)}</strong> • Date: <strong>${safe(formatToDDMMYYYY(activeBooking.date))}</strong>
            </div>
          </div>
          <div>
            <div style="font-size:0.9rem;font-weight:700;color:#0f294a;">
              Class: ${safe(activeBooking.cls)} | Quota: ${safe(activeBooking.quota)}
            </div>
            <div style="font-size:0.85rem;color:#16a34a;font-weight:600;text-align:right;">
              ${activeBooking.farePerPax ? `₹${activeBooking.farePerPax} / pax` : 'Fare as per IRCTC'}
            </div>
          </div>
        </div>
      `;
    }

    const paxSelectorContainer = $('booking-pax-selector');
    const reviewContainer = $('booking-review-summary');
    const irctcHandoffContainer = $('booking-irctc-handoff');
    const btnBack = $('btn-booking-back');
    const btnProceed = $('btn-booking-proceed');

    if (activeBookingStep === 2) {
      if (paxSelectorContainer) paxSelectorContainer.hidden = false;
      if (reviewContainer) reviewContainer.hidden = true;
      if (irctcHandoffContainer) irctcHandoffContainer.hidden = true;
      if (btnBack) btnBack.hidden = true;
      if (btnProceed) {
        btnProceed.hidden = false;
        btnProceed.textContent = 'Continue to Review ➔';
      }
      renderBookingPassengerCheckboxes();
    } else if (activeBookingStep === 3) {
      if (paxSelectorContainer) paxSelectorContainer.hidden = true;
      if (reviewContainer) reviewContainer.hidden = false;
      if (irctcHandoffContainer) irctcHandoffContainer.hidden = true;
      if (btnBack) btnBack.hidden = false;
      if (btnProceed) {
        btnProceed.hidden = false;
        btnProceed.textContent = 'Proceed to IRCTC Handoff ➔';
      }
      renderBookingReview();
    } else if (activeBookingStep === 4) {
      if (paxSelectorContainer) paxSelectorContainer.hidden = true;
      if (reviewContainer) reviewContainer.hidden = true;
      if (irctcHandoffContainer) irctcHandoffContainer.hidden = false;
      if (btnBack) btnBack.hidden = false;
      if (btnProceed) btnProceed.hidden = true; // Final step has IRCTC buttons directly
    }
  }

  function renderBookingPassengerCheckboxes() {
    const listEl = $('booking-pax-list');
    if (!listEl) return;
    const saved = getSavedPassengers();

    if (saved.length === 0) {
      listEl.innerHTML = '<p style="color:#64748b;font-size:0.9rem;padding:10px 0;">No saved passengers yet. Click "+ Quick Add" below to add a passenger.</p>';
      return;
    }

    listEl.innerHTML = saved.map(p => {
      const isChecked = activeBooking.selectedPassengers.some(sp => sp.id === p.id);
      return `
        <label class="booking-pax-item" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #cbd5e1;cursor:pointer;margin-bottom:8px;">
          <input type="checkbox" class="cb-booking-pax" value="${safe(p.id)}" ${isChecked ? 'checked' : ''} style="width:18px;height:18px;" />
          <div style="flex:1;">
            <div style="font-weight:700;color:#0f294a;font-size:0.95rem;">
              ${safe(p.name)} <span style="font-size:0.8rem;color:#64748b;">(${safe(p.age)} yrs, ${safe(p.gender)})</span>
            </div>
            <div style="font-size:0.75rem;color:#475569;">
              Pref: ${safe(p.berth || 'No Preference')} • Food: ${safe(p.food || 'None')}
            </div>
          </div>
        </label>
      `;
    }).join('');

    listEl.querySelectorAll('.cb-booking-pax').forEach(cb => {
      cb.addEventListener('change', () => {
        const pId = cb.value;
        const paxObj = saved.find(p => p.id === pId);
        if (cb.checked) {
          if (!activeBooking.selectedPassengers.some(p => p.id === pId)) {
            activeBooking.selectedPassengers.push(paxObj);
          }
        } else {
          activeBooking.selectedPassengers = activeBooking.selectedPassengers.filter(p => p.id !== pId);
        }
      });
    });
  }

  function renderBookingReview() {
    const reviewEl = $('booking-review-summary');
    if (!reviewEl || !activeBooking) return;

    const count = activeBooking.selectedPassengers.length;
    const estFare = activeBooking.farePerPax > 0 ? (activeBooking.farePerPax * count) : null;

    reviewEl.innerHTML = `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
        <h4 style="margin:0 0 12px 0;color:#0f294a;font-size:1.05rem;">Journey & Passenger Review</h4>
        <div style="font-size:0.9rem;line-height:1.6;color:#334155;margin-bottom:14px;">
          <div>Train: <strong>${safe(activeBooking.trainNumber)} — ${safe(activeBooking.trainName)}</strong></div>
          <div>From: <strong>${safe(activeBooking.fromCode)}</strong> ➔ To: <strong>${safe(activeBooking.toCode)}</strong></div>
          <div>Date: <strong>${safe(formatToDDMMYYYY(activeBooking.date))}</strong> • Class: <strong>${safe(activeBooking.cls)}</strong></div>
          <div>Quota: <strong>${safe(activeBooking.quota)}</strong></div>
        </div>
        <h5 style="margin:12px 0 6px 0;color:#0f294a;">Passengers (${count}):</h5>
        <div style="background:#f8fafc;padding:10px;border-radius:6px;margin-bottom:12px;">
          ${activeBooking.selectedPassengers.map((p, idx) => `
            <div style="font-size:0.85rem;padding:4px 0;border-bottom:1px dashed #e2e8f0;">
              ${idx + 1}. <strong>${safe(p.name)}</strong> (${safe(p.age)}, ${safe(p.gender)}) — Berth: ${safe(p.berth || 'None')}, Food: ${safe(p.food || 'None')}
            </div>
          `).join('')}
        </div>
        ${estFare ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid #cbd5e1;font-weight:700;color:#0f294a;">
            <span>Estimated Total Fare (${count} Pax):</span>
            <span style="color:#16a34a;font-size:1.15rem;">₹${estFare}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Quick Add Passenger inside Booking Modal
  $('btn-quick-add-pax')?.addEventListener('click', () => {
    const qForm = $('booking-quick-add-form');
    if (qForm) qForm.hidden = false;
  });
  $('btn-cancel-qadd')?.addEventListener('click', () => {
    const qForm = $('booking-quick-add-form');
    if (qForm) qForm.hidden = true;
  });
  $('btn-save-qadd')?.addEventListener('click', () => {
    const name = ($('qadd-name')?.value || '').trim();
    const age = Number($('qadd-age')?.value || 0);
    const gender = $('qadd-gender')?.value || 'M';
    const berth = $('qadd-berth')?.value || 'No Preference';

    if (!name || name.length < 2) {
      alert('Please enter a valid name.');
      return;
    }
    if (!age || age < 1 || age > 125) {
      alert('Please enter a valid age (1-125).');
      return;
    }

    const saved = getSavedPassengers();
    const newPax = {
      id: 'pax_' + Date.now(),
      name,
      age,
      gender,
      berth,
      food: 'Veg',
      createdAt: new Date().toISOString()
    };
    saved.push(newPax);
    savePassengerList(saved);

    if (activeBooking && !activeBooking.selectedPassengers.some(p => p.id === newPax.id)) {
      activeBooking.selectedPassengers.push(newPax);
    }

    $('booking-quick-add-form').hidden = true;
    $('qadd-name').value = '';
    $('qadd-age').value = '';
    renderBookingPassengerCheckboxes();
  });

  // Step Navigation in Booking Modal
  $('btn-booking-proceed')?.addEventListener('click', () => {
    if (activeBookingStep === 2) {
      if (!activeBooking.selectedPassengers || activeBooking.selectedPassengers.length === 0) {
        alert('Please select at least one passenger to continue.');
        return;
      }
      if (activeBooking.selectedPassengers.length > 6) {
        alert('Maximum 6 passengers allowed per Indian Railways booking.');
        return;
      }
      activeBookingStep = 3;
      renderBookingStep();
    } else if (activeBookingStep === 3) {
      activeBookingStep = 4;
      renderBookingStep();
      // Save to booking records
      saveBookingRecord({
        id: 'book_' + Date.now(),
        trainNumber: activeBooking.trainNumber,
        trainName: activeBooking.trainName,
        fromCode: activeBooking.fromCode,
        toCode: activeBooking.toCode,
        date: activeBooking.date,
        cls: activeBooking.cls,
        passengers: activeBooking.selectedPassengers,
        timestamp: new Date().toISOString()
      });
    }
  });

  $('btn-booking-back')?.addEventListener('click', () => {
    if (activeBookingStep > 2) {
      activeBookingStep -= 1;
      renderBookingStep();
    }
  });

  // Copy Passenger Details to Clipboard for fast IRCTC pasting
  $('btn-copy-pax-clipboard')?.addEventListener('click', async () => {
    if (!activeBooking || !activeBooking.selectedPassengers.length) return;
    const txt = activeBooking.selectedPassengers.map((p, i) => 
      `Passenger ${i+1}: ${p.name}, Age: ${p.age}, Gender: ${p.gender}, Berth: ${p.berth || 'No Preference'}`
    ).join('\\n');

    try {
      await navigator.clipboard.writeText(txt);
      const btn = $('btn-copy-pax-clipboard');
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = 'Copied to Clipboard! ✓';
        btn.style.background = '#15803d';
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = '';
        }, 2500);
      }
    } catch (_) {
      alert('Passenger Details:\\n\\n' + txt);
    }
  });

  // Proceed to Official IRCTC Button
  $('btn-proceed-irctc-portal')?.addEventListener('click', () => {
    window.open('https://www.irctc.co.in/nget/booking/train-list', '_blank', 'noopener,noreferrer');
  });

  // ==========================================================================
  // CONTROLLED PWA INSTALL EXPERIENCE (No auto banners, single header trigger)
  // ==========================================================================
  // Update header install button status if already standalone
  if (isStandalone) {
    const hdrBtn = $('header-install-btn');
    if (hdrBtn) {
      hdrBtn.textContent = 'App Installed ✓';
      hdrBtn.style.opacity = '0.7';
      hdrBtn.disabled = true;
    }
  }

  $('dash-menu-install')?.addEventListener('click', () => {
    closeDashboardModal();
    triggerAppInstall();
  });
})();
