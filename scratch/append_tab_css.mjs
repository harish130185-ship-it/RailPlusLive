import fs from 'fs';

let css = fs.readFileSync('website/styles.css', 'utf8');

const tabStyles = `
/* ==========================================================================
   UNIFIED 5-TAB BAR & PANEL INTRO STYLES
   ========================================================================== */
.main-tabs-header {
  display: flex;
  align-items: center;
  background: var(--bg-card-subtle);
  border-bottom: 2px solid var(--border-light);
  padding: 8px 12px 0;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.main-tabs-header::-webkit-scrollbar {
  display: none;
}

.main-tab-btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;
}

.main-tab-btn:hover {
  color: var(--irctc-navy);
  background: rgba(15, 41, 74, 0.05);
}

.main-tab-btn.active {
  color: var(--irctc-navy);
  border-bottom-color: var(--irctc-orange);
  background: var(--bg-card);
  font-weight: 700;
}

[data-theme="dark"] .main-tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .main-tab-btn.active {
  color: #ffffff;
  border-bottom-color: var(--irctc-orange);
  background: var(--bg-card);
}

.panel-intro-header {
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-light);
}

.panel-intro-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--irctc-navy);
  margin-bottom: 4px;
}

[data-theme="dark"] .panel-intro-header h3 {
  color: #ffffff;
}

.panel-intro-header p {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0;
}
`;

if (!css.includes('.main-tabs-header')) {
  css += '\n' + tabStyles;
  fs.writeFileSync('website/styles.css', css);
  console.log('Successfully appended .main-tabs-header styles to website/styles.css');
} else {
  console.log('main-tabs-header already in styles.css');
}
