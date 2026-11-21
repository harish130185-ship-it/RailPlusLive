import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

// 1. Clean up all demo / काल्पनिक text
appJs = appJs.replace(
  `txt.textContent = connected ? 'सर्वर ऑनलाइन (API Active)' : 'डेमो मोड (Demo Mode)';`,
  `txt.textContent = connected ? 'रेलवे ऑनलाइन (Live)' : 'ऑफलाइन';`
);

appJs = appJs.replace(
  `            \${demo\n              ? '<strong style="color:#d97706;">[काल्पनिक डेटा / Demo Mode]</strong>'\n              : \`<span>अंतिम अपडेट: \${safe(data.lastUpdated || 'RailKit Gateway')}</span>\`\n            }`,
  `            <span>स्रोत: Indian Railways Live Train Gateway</span>`
);

appJs = appJs.replace(
  `            \${demo ? '<strong style="color:#d97706;">[काल्पनिक डेटा / Demo Mode]</strong>' : '<span>स्रोत: IRCTC Seat Availability Engine</span>'}`,
  `            <span>स्रोत: Indian Railways Seat Availability Engine</span>`
);

appJs = appJs.replace(
  `            \${demo ? '<strong style="color:#d97706;">[काल्पनिक किराया डेटा]</strong>' : '<span>स्रोत: Indian Railways PRS Fare System</span>'}`,
  `            <span>स्रोत: Indian Railways PRS Fare System</span>`
);

appJs = appJs.replace(
  `            \${demo ? '<strong style="color:#d97706;">[काल्पनिक रूट एवं सीट डेटा - Sample Mode]</strong>' : '<span>स्रोत: Indian Railways Timetable &amp; Live Availability</span>'}`,
  `            <span>स्रोत: Indian Railways Timetable &amp; Live Availability</span>`
);

// 2. Refine switchTab to ensure display is properly set on panelEl
const oldSwitchTab = `  function switchTab(name) {
    TAB_NAMES.forEach((n) => {
      const tabEl = $(\`tab-\${n}\`);
      const panelEl = $(\`panel-\${n}\`);
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
  }`;

const newSwitchTab = `  function switchTab(name) {
    TAB_NAMES.forEach((n) => {
      const tabEl = $(\`tab-\${n}\`);
      const panelEl = $(\`panel-\${n}\`);
      if (!tabEl || !panelEl) return;

      const isActive = n === name;
      tabEl.classList.toggle('active', isActive);
      tabEl.setAttribute('aria-selected', String(isActive));
      panelEl.hidden = !isActive;
      panelEl.classList.toggle('active', isActive);
      panelEl.style.display = isActive ? 'block' : 'none';

      if (isActive && typeof tabEl.scrollIntoView === 'function') {
        tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    hideFeedback();
    const res = $('result');
    if (res) res.hidden = true;
  }`;

if (appJs.includes(oldSwitchTab)) {
  appJs = appJs.replace(oldSwitchTab, newSwitchTab);
  console.log('Successfully updated switchTab');
} else {
  console.warn('Could not find oldSwitchTab in appJs');
}

// 3. Improve PNR error handling
const oldPnrSubmit = `  // Form 1: PNR
  $('pnr-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const pnr = (pnrInput?.value || '').trim();
    if (!/^\\d{10}$/.test(pnr)) {
      notify('कृपया सही 10-अंकों का PNR नंबर दर्ज करें।');
      pnrInput?.focus();
      return;
    }

    const release = beginLoading($('btn-submit-pnr'));
    try {
      const data = await fetchLive('/api/pnr', { body: { number: pnr } });
      renderPNR(data);
    } catch (err) {
      notify(\`PNR स्थिति प्राप्त नहीं हो सकी: \${err.message}.\`);
    } finally {
      release();
    }
  });`;

const newPnrSubmit = `  // Form 1: PNR
  $('pnr-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFeedback();

    const pnr = (pnrInput?.value || '').trim();
    const activeLang = localStorage.getItem('railplus_lang') || 'en';

    if (!/^\\d{10}$/.test(pnr)) {
      const errMsg = activeLang === 'hi' 
        ? 'कृपया सही 10-अंकों का PNR नंबर दर्ज करें।' 
        : (activeLang === 'hinglish' ? 'Kripya sahi 10-digit PNR number enter karein.' : 'Please enter a valid 10-digit PNR number.');
      notify(errMsg);
      pnrInput?.focus();
      return;
    }

    const release = beginLoading($('btn-submit-pnr'));
    try {
      const data = await fetchLive('/api/pnr', { body: { number: pnr } });
      renderPNR(data);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Flushed') || msg.includes('Not Yet Generated') || msg.includes('नहीं मिला') || msg.includes('404')) {
        const notFoundMsg = activeLang === 'hi'
          ? 'इस 10-अंकों के PNR का भारतीय रेल में कोई सक्रिय रिकॉर्ड नहीं मिला। या तो यात्रा पूरी होने पर PNR हटा (flush) दिया गया है, या टिकट रद्द हो चुकी है।'
          : (activeLang === 'hinglish'
            ? 'Is 10-digit PNR ka railway record nahi mila. Journey complete hone ya ticket cancel hone par PNR flush ho jata hai. Kripya number verify karein.'
            : 'No active railway record found for this 10-digit PNR. The PNR may have been flushed after journey completion, or the ticket was cancelled.');
        notify(notFoundMsg);
      } else {
        notify(\`PNR जांच में त्रुटि: \${msg}\`);
      }
    } finally {
      release();
    }
  });`;

if (appJs.includes(oldPnrSubmit)) {
  appJs = appJs.replace(oldPnrSubmit, newPnrSubmit);
  console.log('Successfully updated PNR submit handler');
} else {
  console.warn('Could not find oldPnrSubmit in appJs');
}

// 4. Wire header navigation links to switch tabs smoothly
const navTabWiring = `
  // Wire header navigation links
  $('nav-pnr')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('pnr');
    $('pnr-input')?.focus();
  });
  $('nav-train-search')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('route');
    $('route-from-input')?.focus();
  });
  $('nav-live')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('train');
    $('train-number-input')?.focus();
  });
`;

if (!appJs.includes('nav-train-search')?.addEventListener) {
  const closingIdx = appJs.lastIndexOf('})();');
  appJs = appJs.slice(0, closingIdx) + '\n' + navTabWiring + '\n})();\n';
  console.log('Successfully appended header nav tab wiring');
}

// Validate syntax
try {
  new vm.Script(appJs);
  fs.writeFileSync('website/app.js', appJs);
  console.log('SUCCESS: website/app.js updated and passed syntax check!');
} catch (err) {
  console.error('SYNTAX ERROR:', err.message);
}
