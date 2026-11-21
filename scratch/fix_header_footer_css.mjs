import fs from 'fs';

let css = fs.readFileSync('website/styles.css', 'utf8');

const additionalStyles = `
/* ==========================================================================
   HEADER & FOOTER FIXES (Ensures .site-header & .site-footer match perfectly)
   ========================================================================== */
.site-header, .app-header {
  background: var(--irctc-navy, #0f294a) !important;
  border-bottom: 2px solid var(--irctc-orange, #ea580c) !important;
  color: #ffffff !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 999 !important;
  width: 100% !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}

.header-inner, .header-container {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 8px 16px !important;
}

.header-brand {
  display: flex !important;
  align-items: center !important;
  flex-shrink: 0 !important;
}

.logo-link {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  text-decoration: none !important;
  color: #ffffff !important;
}

.logo-symbol {
  width: 38px !important;
  height: 38px !important;
  background: #ffffff !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 2px !important;
  flex-shrink: 0 !important;
}

.brand-logo-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
}

.brand-details {
  display: flex !important;
  flex-direction: column !important;
}

.brand-title {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  line-height: 1.1 !important;
}

.brand-title strong {
  color: var(--irctc-orange, #ea580c) !important;
}

.brand-subtitle {
  font-size: 0.7rem !important;
  color: #cbd5e1 !important;
  font-weight: 400 !important;
}

.header-nav-links {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.nav-link-btn, .nav-item, .nav-item-btn {
  color: #e2e8f0 !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  padding: 6px 10px !important;
  border-radius: 6px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: transparent !important;
  border: none !important;
  cursor: pointer !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
}

.nav-link-btn:hover, .nav-item:hover, .nav-item-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

.header-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-shrink: 0 !important;
}

.header-install-btn, .header-install-action {
  background: var(--irctc-orange, #ea580c) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 6px 12px !important;
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  transition: all 0.15s ease !important;
}

.header-install-btn:hover, .header-install-action:hover {
  background: #c2410c !important;
}

.header-dashboard-btn, .dashboard-icon-btn {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 6px !important;
  padding: 6px 12px !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.site-footer, .app-footer {
  background: var(--irctc-navy, #0f294a) !important;
  color: #cbd5e1 !important;
  padding: 36px 0 0 !important;
  margin-top: 48px !important;
  border-top: 3px solid var(--irctc-orange, #ea580c) !important;
}

.footer-inner, .footer-container {
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 0 16px !important;
  display: grid !important;
  grid-template-columns: 1.5fr 1fr 1fr !important;
  gap: 32px !important;
}

.footer-col h4 {
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  margin-bottom: 12px !important;
}

.footer-col ul {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.footer-col li {
  margin-bottom: 6px !important;
  font-size: 0.82rem !important;
}

.footer-col a {
  color: #cbd5e1 !important;
  text-decoration: none !important;
}

.footer-col a:hover {
  color: #ffffff !important;
  text-decoration: underline !important;
}

.footer-bottom {
  margin-top: 24px !important;
  padding: 14px 16px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  font-size: 0.75rem !important;
  color: #94a3b8 !important;
  text-align: center !important;
}

@media (max-width: 768px) {
  .footer-inner, .footer-container {
    grid-template-columns: 1fr !important;
    gap: 20px !important;
  }
}
`;

css += '\n' + additionalStyles;
fs.writeFileSync('website/styles.css', css);
console.log('Successfully updated website/styles.css with header and footer fixes.');
