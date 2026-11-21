import fs from 'fs';
import vm from 'vm';

let appJs = fs.readFileSync('website/app.js', 'utf8');

// Replace passenger master list and form ID lookups
appJs = appJs.replace(
  `  function renderPassengerMasterList() {\n    const listEl = $('passenger-master-list');`,
  `  function renderPassengerMasterList() {\n    const listEl = $('saved-passengers-list') || $('passenger-master-list');`
);

appJs = appJs.replace(
  `  $('passenger-master-form')?.addEventListener('submit', (e) => {`,
  `  const pmForm = $('add-passenger-form') || $('passenger-master-form');\n  pmForm?.addEventListener('submit', (e) => {`
);

appJs = appJs.replace(
  `    $('passenger-master-form').reset();`,
  `    pmForm.reset();`
);

// Replace saved journeys list and form ID lookups
appJs = appJs.replace(
  `  function renderSavedJourneysList() {\n    const listEl = $('saved-journeys-list');`,
  `  function renderSavedJourneysList() {\n    const listEl = $('saved-journeys-items-list') || $('saved-journeys-list');`
);

appJs = appJs.replace(
  `  $('add-journey-form')?.addEventListener('submit', (e) => {`,
  `  const sjForm = $('add-saved-journey-form') || $('add-journey-form');\n  sjForm?.addEventListener('submit', (e) => {`
);

appJs = appJs.replace(
  `    $('add-journey-form').reset();`,
  `    sjForm.reset();`
);

// Now update Booking Flow logic to match index.html elements:
// booking-step-content-main vs booking-handoff-section
// booking-passenger-selection-list, booking-final-review, quick-add-pax-box
const oldBookingLogic = `  function renderBookingStep() {
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
      trainInfoEl.innerHTML = \`
        <div style="background:#f1f5f9;border-left:4px solid #ea580c;padding:12px 16px;border-radius:6px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-weight:700;color:#0f294a;font-size:1.05rem;">
              \${safe(activeBooking.trainNumber)} — \${safe(activeBooking.trainName)}
            </div>
            <div style="font-size:0.85rem;color:#475569;margin-top:2px;">
              Route: <strong>\${safe(activeBooking.fromCode)}</strong> ➔ <strong>\${safe(activeBooking.toCode)}</strong> • Date: <strong>\${safe(formatToDDMMYYYY(activeBooking.date))}</strong>
            </div>
          </div>
          <div>
            <div style="font-size:0.9rem;font-weight:700;color:#0f294a;">
              Class: \${safe(activeBooking.cls)} | Quota: \${safe(activeBooking.quota)}
            </div>
            <div style="font-size:0.85rem;color:#16a34a;font-weight:600;text-align:right;">
              \${activeBooking.farePerPax ? \`₹\${activeBooking.farePerPax} / pax\` : 'Fare as per IRCTC'}
            </div>
          </div>
        </div>
      \`;
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
  }`;

const newBookingLogic = `  function renderBookingStep() {
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
      trainInfoEl.innerHTML = \`
        <div style="background:#f1f5f9;border-left:4px solid #ea580c;padding:12px 16px;border-radius:6px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-weight:700;color:#0f294a;font-size:1.05rem;">
              \${safe(activeBooking.trainNumber)} — \${safe(activeBooking.trainName)}
            </div>
            <div style="font-size:0.85rem;color:#475569;margin-top:2px;">
              Route: <strong>\${safe(activeBooking.fromCode)}</strong> ➔ <strong>\${safe(activeBooking.toCode)}</strong> • Date: <strong>\${safe(formatToDDMMYYYY(activeBooking.date))}</strong>
            </div>
          </div>
          <div>
            <div style="font-size:0.9rem;font-weight:700;color:#0f294a;">
              Class: \${safe(activeBooking.cls)} | Quota: \${safe(activeBooking.quota)}
            </div>
            <div style="font-size:0.85rem;color:#16a34a;font-weight:600;text-align:right;">
              \${activeBooking.farePerPax ? \`₹\${activeBooking.farePerPax} / pax\` : 'Fare as per IRCTC'}
            </div>
          </div>
        </div>
      \`;
    }

    const stepMain = $('booking-step-content-main');
    const stepHandoff = $('booking-handoff-section');
    const btnBack = $('btn-booking-back');
    const btnProceed = $('btn-booking-proceed');

    if (activeBookingStep <= 2) {
      if (stepMain) stepMain.style.display = 'block';
      if (stepHandoff) stepHandoff.style.display = 'none';
      if (btnBack) btnBack.style.display = 'none';
      if (btnProceed) {
        btnProceed.style.display = 'block';
        btnProceed.textContent = 'Continue to Review ➔';
      }
      renderBookingPassengerCheckboxes();
    } else {
      if (stepMain) stepMain.style.display = 'none';
      if (stepHandoff) stepHandoff.style.display = 'block';
      if (btnBack) btnBack.style.display = 'inline-flex';
      if (btnProceed) btnProceed.style.display = 'none';
      renderBookingReview();
    }
  }`;

if (appJs.includes(oldBookingLogic)) {
  appJs = appJs.replace(oldBookingLogic, newBookingLogic);
  console.log('Successfully updated renderBookingStep');
} else {
  console.warn('Could not find oldBookingLogic');
}

// Update renderBookingPassengerCheckboxes to use booking-passenger-selection-list
appJs = appJs.replace(
  `  function renderBookingPassengerCheckboxes() {\n    const listEl = $('booking-pax-list');`,
  `  function renderBookingPassengerCheckboxes() {\n    const listEl = $('booking-passenger-selection-list') || $('booking-pax-list');`
);

// Update renderBookingReview to use booking-final-review
appJs = appJs.replace(
  `  function renderBookingReview() {\n    const reviewEl = $('booking-review-summary');`,
  `  function renderBookingReview() {\n    const reviewEl = $('booking-final-review') || $('booking-review-summary');`
);

// Update Quick Add Box toggle
appJs = appJs.replace(
  `  $('btn-quick-add-pax')?.addEventListener('click', () => {\n    const qForm = $('booking-quick-add-form');\n    if (qForm) qForm.hidden = false;\n  });\n  $('btn-cancel-qadd')?.addEventListener('click', () => {\n    const qForm = $('booking-quick-add-form');\n    if (qForm) qForm.hidden = true;\n  });`,
  `  $('btn-quick-add-pax')?.addEventListener('click', () => {\n    const qForm = $('quick-add-pax-box') || $('booking-quick-add-form');\n    if (qForm) qForm.style.display = 'block';\n  });\n  $('btn-cancel-qadd')?.addEventListener('click', () => {\n    const qForm = $('quick-add-pax-box') || $('booking-quick-add-form');\n    if (qForm) qForm.style.display = 'none';\n  });`
);

appJs = appJs.replace(
  `    $('booking-quick-add-form').hidden = true;`,
  `    const qForm = $('quick-add-pax-box') || $('booking-quick-add-form'); if (qForm) qForm.style.display = 'none';`
);

// Update btn-booking-proceed click logic
const oldProceedLogic = `  // Step Navigation in Booking Modal
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
  });`;

const newProceedLogic = `  // Step Navigation in Booking Modal
  $('btn-booking-proceed')?.addEventListener('click', () => {
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
  });

  $('btn-booking-back')?.addEventListener('click', () => {
    activeBookingStep = 2;
    renderBookingStep();
  });`;

if (appJs.includes(oldProceedLogic)) {
  appJs = appJs.replace(oldProceedLogic, newProceedLogic);
  console.log('Successfully updated proceed navigation logic');
} else {
  console.warn('Could not find oldProceedLogic');
}

// Validate syntax
try {
  new vm.Script(appJs);
  console.log('SUCCESS: website/app.js passed syntax check!');
  fs.writeFileSync('website/app.js', appJs);
} catch (err) {
  console.error('SYNTAX ERROR:', err.message);
}
