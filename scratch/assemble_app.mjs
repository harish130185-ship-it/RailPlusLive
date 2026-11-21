import fs from 'fs';

let appJs = fs.readFileSync('website/app.js', 'utf8');

// 1. Remove automatic PWA banner popups
appJs = appJs.replace(
  `  // Show banner after brief delay if not standalone\n  if (!isStandalone) {\n    setTimeout(showPwaBanner, 1000);\n  }`,
  `  // PWA banner is kept suppressed per user specification - only triggered on user click`
);

appJs = appJs.replace(
  `  // Capture native browser beforeinstallprompt event\n  window.addEventListener('beforeinstallprompt', (e) => {\n    e.preventDefault();\n    deferredInstallPrompt = e;\n    showPwaBanner();\n  });`,
  `  // Capture native browser beforeinstallprompt event (deferred without automatic banner popup)\n  window.addEventListener('beforeinstallprompt', (e) => {\n    e.preventDefault();\n    deferredInstallPrompt = e;\n  });`
);

// 2. Enhance renderRoute to include Book button
const targetRenderRouteCard = `            <div class="train-classes-container">
              \${classesHtml}
            </div>
          </div>
        </div>`;

const replacementRenderRouteCard = `            <div class="train-classes-container">
              \${classesHtml}
            </div>
            <div class="train-booking-bar" style="margin-top:12px;padding-top:10px;border-top:1px dashed #e2e8f0;display:flex;justify-content:flex-end;align-items:center;gap:12px;">
              <span style="font-size:0.75rem;color:#64748b;">Official Booking Assistance</span>
              <button type="button" class="btn-book-train" 
                      data-train="\${safe(trainNo)}" 
                      data-trainname="\${safe(t.trainName)}"
                      data-from="\${safe(fromStn)}" 
                      data-to="\${safe(toStn)}" 
                      data-date="\${safe(targetDate)}"
                      style="background:#ea580c;color:#ffffff;border:none;padding:7px 18px;border-radius:6px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(234,88,12,0.3);">
                <span>Book Ticket (IRCTC Assist) ➔</span>
              </button>
            </div>
          </div>
        </div>`;

if (appJs.includes(targetRenderRouteCard)) {
  appJs = appJs.replace(targetRenderRouteCard, replacementRenderRouteCard);
  console.log('Successfully added Book Ticket button to train cards.');
} else {
  console.warn('Could not find targetRenderRouteCard in appJs');
}

// 3. Attach click handler for .btn-book-train in renderRoute
const targetCardListeners = `    // Attach click listeners to all class cards
    document.querySelectorAll('.class-card').forEach(card => {`;

const replacementCardListeners = `    // Attach click listeners to all Book Ticket buttons
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
    document.querySelectorAll('.class-card').forEach(card => {`;

if (appJs.includes(targetCardListeners)) {
  appJs = appJs.replace(targetCardListeners, replacementCardListeners);
  console.log('Successfully wired .btn-book-train click listener in renderRoute.');
} else {
  console.warn('Could not find targetCardListeners in appJs');
}

// 4. Inject all the new modules before the closing })();
const moduleCode = fs.readFileSync('scratch/test_modules.mjs', 'utf8');
const codeStart = moduleCode.indexOf('  // ==========================================================================\n  // MULTILANGUAGE LOCALIZATION');
const codeEnd = moduleCode.indexOf(`console.log('Script parsed successfully, ready to splice.');`);
const modulesToInject = moduleCode.slice(codeStart, codeEnd);

const closingIdx = appJs.lastIndexOf('})();');
if (closingIdx !== -1) {
  appJs = appJs.slice(0, closingIdx) + '\n' + modulesToInject + '\n})();\n';
  console.log('Successfully appended all upgraded modules before closing IIFE.');
} else {
  console.error('Could not find closing IIFE in appJs');
}

fs.writeFileSync('website/app.js', appJs);
console.log('Successfully updated website/app.js!');
