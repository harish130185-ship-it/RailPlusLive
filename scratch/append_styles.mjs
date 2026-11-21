import fs from 'node:fs';

const extraCss = `
/* ==========================================================================
   IRCTC-Inspired Professional UI, Dark Mode, Booking Workflow & Masters
   ========================================================================== */

:root {
  --irctc-orange: #ea580c;
  --irctc-orange-hover: #c2410c;
  --irctc-orange-light: #ffedd5;
  --irctc-navy: #0f294a;
  --irctc-navy-light: #1e3a5f;
  --irctc-navy-dark: #0a1b32;
  --irctc-green: #16a34a;
  --irctc-green-light: #dcfce7;
  --irctc-gold: #f59e0b;
  --irctc-surface: #ffffff;
  --irctc-bg: #f1f5f9;
  --irctc-border: #e2e8f0;
  --irctc-text: #0f172a;
  --irctc-text-muted: #64748b;
  --irctc-shadow: 0 4px 20px -2px rgba(15, 41, 74, 0.12);
}

[data-theme="dark"] {
  --header-bg: #091322;
  --header-border: #152238;
  --header-text: #ffffff;
  --brand-primary: #38bdf8;
  --brand-accent: #fb923c;
  --bg-page: #0b1120;
  --bg-card: #131d33;
  --bg-card-subtle: #192744;
  --bg-input: #1a2744;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-light: #64748b;
  --border-light: #25334d;
  --border-subtle: #1e2c45;
  --border-focus: #fb923c;
  --irctc-surface: #131d33;
  --irctc-bg: #0b1120;
  --irctc-border: #25334d;
  --irctc-text: #f8fafc;
  --irctc-text-muted: #94a3b8;
  --irctc-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
}

/* Hide legacy automatic top banner to comply with single controlled PWA install */
.pwa-install-banner, #pwa-install-banner {
  display: none !important;
}

/* --- Enhanced Header & Nav --- */
.app-header {
  background: var(--header-bg);
  border-bottom: 2px solid var(--irctc-orange);
  position: sticky;
  top: 0;
  z-index: 999;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
}

.brand-title strong {
  color: var(--irctc-orange);
}

.header-nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link-btn {
  color: #e2e8f0;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.nav-link-btn:hover, .nav-link-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  text-decoration: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Language Dropdown Selector */
.lang-selector-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.lang-select {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  padding: 5px 8px 5px 26px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  appearance: auto;
}

.lang-select:hover, .lang-select:focus {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--irctc-orange);
}

.lang-select option {
  background: #0f294a;
  color: #ffffff;
}

.lang-icon {
  position: absolute;
  left: 8px;
  pointer-events: none;
  font-size: 0.85rem;
}

/* Dark Mode Button */
.btn-theme-toggle {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--irctc-orange);
}

/* Controlled Single PWA Install Option */
.header-install-btn {
  background: var(--irctc-orange);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.header-install-btn:hover {
  background: var(--irctc-orange-hover);
  transform: translateY(-1px);
}

.header-dashboard-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-dashboard-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  color: #ffffff;
  border: none;
  font-size: 1.4rem;
  padding: 4px;
  cursor: pointer;
}

/* --- Hero IRCTC Train Booking Section --- */
.hero-booking-section {
  background: linear-gradient(180deg, rgba(15, 41, 74, 0.05) 0%, rgba(241, 245, 249, 0) 100%);
  padding: 24px 0 32px;
}

.hero-booking-card {
  background: var(--bg-card);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(15, 41, 74, 0.1);
  border: 1px solid var(--border-light);
  overflow: hidden;
  margin-bottom: 20px;
}

.hero-booking-header {
  background: linear-gradient(135deg, var(--irctc-navy) 0%, var(--irctc-navy-light) 100%);
  color: #ffffff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-title-box h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.hero-badge {
  background: var(--irctc-orange);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.hero-booking-body {
  padding: 24px 20px 20px;
}

/* Station Interchange Button */
.station-row-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.station-input-col {
  flex: 1;
  min-width: 0;
}

.btn-station-swap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1.5px solid var(--irctc-orange);
  color: var(--irctc-orange);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.15);
  transition: all 0.2s ease;
  margin-top: 14px;
}

.btn-station-swap:hover {
  background: var(--irctc-orange);
  color: #ffffff;
  transform: rotate(180deg);
}

/* Quick Date Chips */
.quick-date-chips {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.date-chip {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.date-chip:hover, .date-chip.active {
  background: var(--irctc-orange-light);
  border-color: var(--irctc-orange);
  color: var(--irctc-orange-hover);
}

/* Hero Search CTA Button */
.btn-hero-search {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);
  transition: all 0.2s ease;
  width: 100%;
}

.btn-hero-search:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45);
}

/* Quick Shortcuts Row */
.quick-shortcuts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.shortcut-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-sm);
}

.shortcut-card:hover {
  border-color: var(--irctc-orange);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 41, 74, 0.08);
}

.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--irctc-orange-light);
  color: var(--irctc-orange);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.shortcut-info strong {
  font-size: 0.85rem;
  color: var(--text-main);
  display: block;
}

.shortcut-info span {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Secondary Enquiry Tabs Bar */
.secondary-enquiry-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 16px;
  margin-top: 10px;
}

.secondary-tab-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  padding: 7px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.secondary-tab-btn:hover, .secondary-tab-btn.active {
  background: var(--irctc-navy);
  color: #ffffff;
  border-color: var(--irctc-navy);
}

/* --- Train Results Filter & Sorting Toolbar --- */
.train-results-toolbar {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.filter-pill {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-light);
  color: var(--text-main);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill.active {
  background: var(--irctc-orange);
  color: #ffffff;
  border-color: var(--irctc-orange);
}

.sort-select {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  color: var(--text-main);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  outline: none;
}

/* Train Card Class Booking Action */
.btn-book-class {
  background: var(--irctc-orange);
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 6px;
  display: inline-block;
  width: 100%;
  text-align: center;
  transition: all 0.15s ease;
}

.btn-book-class:hover {
  background: var(--irctc-orange-hover);
}

/* --- Multi-step Booking Assistance Modal --- */
.booking-modal-overlay,
.passenger-modal-overlay,
.journeys-modal-overlay,
.dashboard-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.booking-modal-card,
.passenger-modal-card,
.journeys-modal-card,
.dashboard-modal-card {
  background: var(--bg-card);
  color: var(--text-main);
  border-radius: 14px;
  max-width: 620px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 10001;
  display: flex;
  flex-direction: column;
}

.modal-header-irctc {
  background: var(--irctc-navy);
  color: #ffffff;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-irctc h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 2px 6px;
}

.modal-close-btn:hover {
  color: #ffffff;
}

.booking-steps-bar {
  display: flex;
  background: var(--bg-card-subtle);
  border-bottom: 1px solid var(--border-light);
  padding: 8px 16px;
}

.booking-step-item {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  position: relative;
}

.booking-step-item.active {
  color: var(--irctc-orange);
  font-weight: 700;
}

.booking-step-item.completed {
  color: var(--irctc-green);
}

.modal-body-scroll {
  padding: 18px 20px;
  overflow-y: auto;
  flex: 1;
}

.journey-summary-box {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.journey-summary-box strong {
  color: var(--irctc-navy);
  font-size: 0.95rem;
}

/* Passenger Selector & Cards in Booking Modal */
.passenger-pick-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.passenger-check-card {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-card);
}

.passenger-check-card:hover, .passenger-check-card.selected {
  border-color: var(--irctc-orange);
  background: var(--irctc-orange-light);
}

.passenger-check-card input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--irctc-orange);
}

/* IRCTC Handoff Banner */
.irctc-handoff-banner {
  background: #fff7ed;
  border: 1.5px dashed var(--irctc-orange);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  margin-top: 14px;
}

.irctc-handoff-banner h4 {
  color: #9a3412;
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.irctc-handoff-banner p {
  font-size: 0.8rem;
  color: #431407;
  line-height: 1.45;
  margin-bottom: 14px;
}

.handoff-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-copy-passenger-details {
  background: #ffffff;
  border: 1.5px solid var(--irctc-orange);
  color: var(--irctc-orange);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-passenger-details:hover {
  background: var(--irctc-orange);
  color: #ffffff;
}

.btn-proceed-irctc {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
}

.btn-proceed-irctc:hover {
  text-decoration: none;
  background: #c2410c;
}

/* --- Passenger Master Modal & Cards --- */
.passenger-item-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  box-shadow: var(--shadow-sm);
}

.passenger-meta-row {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 3px;
  flex-wrap: wrap;
}

.passenger-badge {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.action-btn-del {
  color: #ef4444;
  background: #fee2e2;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 0.75rem;
  cursor: pointer;
}

.action-btn-del:hover {
  background: #fecaca;
}

/* --- Saved Journeys Cards --- */
.saved-journey-item {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 10px;
}

.btn-search-saved-route {
  background: var(--irctc-orange);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.btn-search-saved-route:hover {
  background: var(--irctc-orange-hover);
}

/* --- User Dashboard Layout --- */
.dashboard-grid-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.dash-stat-box {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.dash-stat-box strong {
  display: block;
  font-size: 1.3rem;
  color: var(--irctc-orange);
}

.dash-stat-box span {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.dash-menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dash-menu-item {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-main);
  transition: all 0.15s ease;
}

.dash-menu-item:hover {
  border-color: var(--irctc-orange);
  background: var(--bg-card-subtle);
}

/* Mobile Responsive Adjustments */
@media (max-width: 768px) {
  .header-nav-links {
    display: none;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .station-row-wrapper {
    flex-direction: column;
    gap: 8px;
  }

  .btn-station-swap {
    margin: -4px auto;
  }

  .quick-shortcuts-row {
    grid-template-columns: 1fr 1fr;
  }

  .booking-modal-card,
  .passenger-modal-card,
  .journeys-modal-card,
  .dashboard-modal-card {
    max-height: 95vh;
    border-radius: 10px;
  }
}

@media (max-width: 480px) {
  .quick-shortcuts-row {
    grid-template-columns: 1fr;
  }
  
  .dashboard-grid-stats {
    grid-template-columns: 1fr;
  }
}
`;

fs.appendFileSync('website/styles.css', extraCss);
console.log('Successfully appended IRCTC styles to website/styles.css');
