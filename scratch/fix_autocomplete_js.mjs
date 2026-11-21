import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

// Replace setupStationAutocomplete
const oldStationAcStart = `  // Setup Autocomplete for Station Inputs\n  function setupStationAutocomplete(input) {`;
const oldStationAcEnd = `  // Setup Autocomplete for Train Inputs\n  function setupTrainAutocomplete(input, autoSubmitForm = false) {`;

const newStationAc = `  // Setup Autocomplete for Station Inputs
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
        dropdown.hidden = true;
        dropdown.classList.remove('open');
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
      }

      dropdown.innerHTML = list.map((stn, idx) => \`
        <div class="autocomplete-item \${idx === activeIndex ? 'active' : ''}" data-code="\${safe(stn.code)}" data-name="\${safe(stn.name)}">
          <div class="ac-code-badge">\${safe(stn.code)}</div>
          <div style="flex:1;">
            <div class="ac-name-text">\${safe(stn.name)}</div>
            \${stn.hindi ? \`<div class="ac-sub-text">\${safe(stn.hindi)}</div>\` : ''}
          </div>
        </div>
      \`).join('');

      dropdown.hidden = false;
      dropdown.classList.add('open');
      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          const code = item.dataset.code;
          const name = item.dataset.name;
          input.value = \`\${code} — \${name}\`;
          input.dataset.code = code;
          dropdown.hidden = true;
          dropdown.classList.remove('open');
          dropdown.style.display = 'none';
        });
      });
    }

    async function searchStations(query) {
      const q = query.trim().toUpperCase();
      if (!q) {
        dropdown.hidden = true;
        dropdown.classList.remove('open');
        dropdown.style.display = 'none';
        return;
      }

      // 1. Search local dictionary (instant response)
      const localMatches = POPULAR_STATIONS.filter(s =>
        s.code.includes(q) ||
        s.name.toUpperCase().includes(q) ||
        (s.hindi && s.hindi.includes(q))
      ).slice(0, 8);

      renderList(localMatches);

      // 2. Fetch live server suggestions (works both with and without apiBase)
      if (q.length >= 2) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          try {
            const res = await fetchLive(\`/api/stations?q=\${encodeURIComponent(q)}\`);
            const serverStations = res?.data?.stations || res?.data || res?.stations || (Array.isArray(res) ? res : []);
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
        }, 150);
      }
    }

    input.addEventListener('input', (e) => {
      input.dataset.code = '';
      searchStations(e.target.value);
    });

    input.addEventListener('focus', () => {
      if (input.value) searchStations(input.value);
    });

    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.autocomplete-item');
      if (!items.length || dropdown.hidden || dropdown.style.display === 'none') return;

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
        dropdown.hidden = true;
        dropdown.classList.remove('open');
        dropdown.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.hidden = true;
        dropdown.classList.remove('open');
        dropdown.style.display = 'none';
      }
    });
  }

  // Setup Autocomplete for Train Inputs
  function setupTrainAutocomplete(input, autoSubmitForm = false) {`;

if (appJs.includes(oldStationAcStart)) {
  const startIdx = appJs.indexOf(oldStationAcStart);
  const endIdx = appJs.indexOf(oldStationAcEnd) + oldStationAcEnd.length;
  appJs = appJs.slice(0, startIdx) + newStationAc + appJs.slice(endIdx);
  console.log('Successfully replaced setupStationAutocomplete');
} else {
  console.warn('Could not find oldStationAcStart');
}

// Ensure all inputs are explicitly wired
const oldInitAutocomplete = `  document.querySelectorAll('.station-autocomplete').forEach(setupStationAutocomplete);\n  const liveTrainEl = $('train-number-input') || $('train-input');\n  if (liveTrainEl) setupTrainAutocomplete(liveTrainEl, true);\n  if ($('seats-train-input')) setupTrainAutocomplete($('seats-train-input'), false);\n  if ($('fare-train-input')) setupTrainAutocomplete($('fare-train-input'), false);`;

const newInitAutocomplete = `  // Explicitly wire all station autocomplete inputs
  ['route-from-input', 'route-to-input', 'seats-from-input', 'seats-to-input', 'fare-from-input', 'fare-to-input'].forEach(id => {
    const el = $(id);
    if (el) setupStationAutocomplete(el);
  });
  document.querySelectorAll('.station-autocomplete').forEach(setupStationAutocomplete);

  // Explicitly wire all train autocomplete inputs
  const liveTrainEl = $('train-number-input') || $('train-input');
  if (liveTrainEl) setupTrainAutocomplete(liveTrainEl, true);
  if ($('seats-train-input')) setupTrainAutocomplete($('seats-train-input'), false);
  if ($('fare-train-input')) setupTrainAutocomplete($('fare-train-input'), false);
  document.querySelectorAll('.train-autocomplete').forEach(el => setupTrainAutocomplete(el, el.id === 'train-number-input' || el.id === 'train-input'));`;

if (appJs.includes(oldInitAutocomplete)) {
  appJs = appJs.replace(oldInitAutocomplete, newInitAutocomplete);
  console.log('Successfully updated autocomplete initialization');
} else {
  console.warn('Could not find oldInitAutocomplete');
}

// Validate syntax
try {
  new vm.Script(appJs);
  fs.writeFileSync('website/app.js', appJs);
  console.log('SUCCESS: website/app.js updated and syntax verified!');
} catch (err) {
  console.error('SYNTAX ERROR:', err.message);
}
