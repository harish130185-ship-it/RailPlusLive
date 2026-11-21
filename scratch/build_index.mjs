import fs from 'node:fs';

const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0f294a" />
  <meta name="description" content="RailPlus — IRCTC-inspired Indian Railway ticket booking assistance, live train running status, PNR enquiry, seat availability and fare lookup." />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="RailPlus" />
  <link rel="apple-touch-icon" href="icon-192.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="icon-192.png" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="stylesheet" href="styles.css?v=17.0" />
  <title>RailPlus — IRCTC-Inspired Indian Railway Ticket Booking &amp; Live Enquiry</title>
</head>
<body>
  <!-- Manual Install Guide Modal (Shown only if user clicks Install and browser doesn't support automatic prompt) -->
  <div id="pwa-guide-modal" class="pwa-modal-overlay" hidden>
    <div class="pwa-modal-card">
      <div class="pwa-modal-header">
        <div class="pwa-modal-title">
          <img src="logo.png" alt="RailPlus" style="width:28px;height:28px;object-fit:contain;background:#ffffff;border-radius:4px;padding:2px;" />
          <h3 data-i18n="install_app_title">Install RailPlus App</h3>
        </div>
        <button type="button" id="btn-close-pwa-modal" class="pwa-modal-close" aria-label="Close">✕</button>
      </div>
      <div class="pwa-modal-body">
        <div class="install-guide-step">
          <div class="step-num">1</div>
          <div class="step-text">
            <strong data-i18n="install_step_1_title">Open Browser Menu</strong>
            <p data-i18n="install_step_1_desc">Tap the <strong>3 dots (⋮)</strong> menu in Chrome or the <strong>Share (⎋)</strong> button in Safari.</p>
          </div>
        </div>
        <div class="install-guide-step">
          <div class="step-num">2</div>
          <div class="step-text">
            <strong data-i18n="install_step_2_title">Select 'Install app' or 'Add to Home screen'</strong>
            <p data-i18n="install_step_2_desc">Choose <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong> from the menu options.</p>
          </div>
        </div>
        <div class="install-guide-step">
          <div class="step-num">3</div>
          <div class="step-text">
            <strong data-i18n="install_step_3_title">Confirm Installation</strong>
            <p data-i18n="install_step_3_desc">Tap <strong>"Install"</strong> to add the RailPlus app to your mobile home screen.</p>
          </div>
        </div>
      </div>
      <div class="pwa-modal-footer">
        <button type="button" id="btn-understood-pwa" class="submit-button" style="width:100%;height:44px;" data-i18n="btn_got_it">Got It</button>
      </div>
    </div>
  </div>

  <!-- Header / Navigation -->
  <header class="app-header">
    <div class="header-container">
      <div class="header-brand">
        <a href="#home" class="logo-link" id="brand-logo-btn" title="RailPlus — Home">
          <div class="logo-symbol">
            <img src="logo.png" alt="RailPlus Logo" class="brand-logo-img" />
          </div>
          <div class="brand-details">
            <span class="brand-title">Rail<strong>Plus</strong></span>
            <span class="brand-subtitle" data-i18n="header_subtitle">Indian Railway Travel &amp; Booking Portal</span>
          </div>
        </a>
      </div>

      <!-- Desktop Navigation Menu -->
      <nav class="header-nav-links" aria-label="Main Navigation">
        <a href="#home" class="nav-link-btn active" id="nav-btn-home">
          <span>🚆</span>
          <span data-i18n="nav_train_search">Train Booking</span>
        </a>
        <a href="#pnr" class="nav-link-btn" id="nav-btn-pnr">
          <span>🎫</span>
          <span data-i18n="nav_pnr">PNR Status</span>
        </a>
        <a href="#train" class="nav-link-btn" id="nav-btn-live">
          <span>📍</span>
          <span data-i18n="nav_live">Live Train</span>
        </a>
        <button type="button" class="nav-link-btn" id="nav-btn-passengers">
          <span>👤</span>
          <span data-i18n="nav_passengers">Passenger Master</span>
        </button>
        <button type="button" class="nav-link-btn" id="nav-btn-journeys">
          <span>⭐</span>
          <span data-i18n="nav_journeys">Saved Journeys</span>
        </button>
      </nav>

      <!-- Right Header Actions -->
      <div class="header-actions">
        <!-- Language Switcher -->
        <div class="lang-selector-wrapper" title="Change Language / भाषा बदलें">
          <span class="lang-icon">🌐</span>
          <select id="lang-selector" class="lang-select" aria-label="Language Selector">
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>

        <!-- Dark Mode Toggle Button -->
        <button type="button" id="btn-theme-toggle" class="btn-theme-toggle" title="Toggle Dark / Light Theme" aria-label="Toggle Theme">
          <span id="theme-icon">🌙</span>
        </button>

        <!-- Single Controlled PWA Install Button -->
        <button type="button" id="header-install-btn" class="header-install-btn" title="Install RailPlus App">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span id="header-install-text" data-i18n="btn_install_app">Install App</span>
        </button>

        <!-- User Dashboard Button -->
        <button type="button" id="btn-open-dashboard" class="header-dashboard-btn" title="Open Dashboard">
          <span>👤</span>
          <span data-i18n="btn_dashboard">Dashboard</span>
        </button>

        <!-- Mobile Drawer Toggle -->
        <button type="button" id="btn-mobile-menu" class="mobile-menu-toggle" aria-label="Open Navigation Menu">
          ☰
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main class="main-content" id="home">
    <div class="content-container">

      <!-- Hero IRCTC-Inspired Train Search Section -->
      <section class="hero-booking-section">
        <div class="hero-booking-card">
          <div class="hero-booking-header">
            <div class="hero-title-box">
              <span style="font-size:1.3rem;">🚆</span>
              <h2 data-i18n="hero_booking_title">BOOK TICKET / SEARCH TRAINS</h2>
            </div>
            <div>
              <span class="hero-badge" data-i18n="hero_badge">Official IRCTC Booking Assistance</span>
            </div>
          </div>

          <div class="hero-booking-body">
            <!-- Train Booking Form -->
            <form id="route-form" class="search-form" novalidate>
              <div class="station-row-wrapper">
                <!-- From Station -->
                <div class="station-input-col field-container flex-1">
                  <label for="route-from-input" class="field-label">
                    <span data-i18n="lbl_from_station">From Station</span>
                    <span id="route-from-code-badge" class="selected-station-tag" hidden></span>
                  </label>
                  <div class="input-wrapper autocomplete-container">
                    <span class="input-icon">📍</span>
                    <input 
                      id="route-from-input" 
                      type="text" 
                      autocomplete="off" 
                      placeholder="e.g. NDLS (New Delhi) or ADI (Ahmedabad)" 
                      data-i18n-ph="ph_from_station"
                      required 
                    />
                    <div id="route-from-suggestions" class="autocomplete-dropdown" hidden></div>
                  </div>
                </div>

                <!-- Station Interchange / Swap Button (⇄) -->
                <button type="button" id="btn-hero-swap-stations" class="btn-station-swap" title="Interchange Stations" aria-label="Swap From and To Stations">
                  ⇄
                </button>

                <!-- To Station -->
                <div class="station-input-col field-container flex-1">
                  <label for="route-to-input" class="field-label">
                    <span data-i18n="lbl_to_station">To Station</span>
                    <span id="route-to-code-badge" class="selected-station-tag" hidden></span>
                  </label>
                  <div class="input-wrapper autocomplete-container">
                    <span class="input-icon">🏁</span>
                    <input 
                      id="route-to-input" 
                      type="text" 
                      autocomplete="off" 
                      placeholder="e.g. MMCT (Mumbai Central) or LKO (Lucknow)" 
                      data-i18n-ph="ph_to_station"
                      required 
                    />
                    <div id="route-to-suggestions" class="autocomplete-dropdown" hidden></div>
                  </div>
                </div>
              </div>

              <!-- Journey Date, Class & Quota Row -->
              <div class="form-group-row" style="margin-top:16px;">
                <!-- Date Input -->
                <div class="field-container flex-1">
                  <label for="route-date-input" class="field-label">
                    <span data-i18n="lbl_journey_date">Journey Date</span>
                  </label>
                  <div class="input-wrapper">
                    <input id="route-date-input" type="date" lang="en-IN" title="Date format: DD-MM-YYYY" required />
                  </div>
                  <!-- Quick Date Chips -->
                  <div class="quick-date-chips">
                    <button type="button" class="date-chip" id="chip-date-today" data-i18n="chip_today">Today</button>
                    <button type="button" class="date-chip active" id="chip-date-tomorrow" data-i18n="chip_tomorrow">Tomorrow</button>
                    <button type="button" class="date-chip" id="chip-date-dayafter" data-i18n="chip_dayafter">Day After</button>
                  </div>
                  <span class="field-subtext" data-i18n="date_format_subtext">Format: DD-MM-YYYY</span>
                </div>

                <!-- Travel Class Dropdown -->
                <div class="field-container flex-1">
                  <label for="hero-class-select" class="field-label">
                    <span data-i18n="lbl_class">All Classes</span>
                  </label>
                  <div class="input-wrapper">
                    <select id="hero-class-select">
                      <option value="ALL" data-i18n="opt_all_classes">All Classes (सभी क्लास)</option>
                      <option value="SL">Sleeper (SL)</option>
                      <option value="3A" selected>AC 3 Tier (3A)</option>
                      <option value="2A">AC 2 Tier (2A)</option>
                      <option value="1A">AC First Class (1A)</option>
                      <option value="3E">AC 3 Economy (3E)</option>
                      <option value="CC">AC Chair Car (CC)</option>
                      <option value="2S">Second Sitting (2S)</option>
                      <option value="EC">Exec. Chair Car (EC)</option>
                    </select>
                  </div>
                  <span class="field-subtext" data-i18n="opt_class_subtext">Select travel accommodation</span>
                </div>

                <!-- Quota Dropdown -->
                <div class="field-container flex-1">
                  <label for="hero-quota-select" class="field-label">
                    <span data-i18n="lbl_quota">Quota</span>
                  </label>
                  <div class="input-wrapper">
                    <select id="hero-quota-select">
                      <option value="GN" selected data-i18n="quota_general">General Quota (GN)</option>
                      <option value="TQ" data-i18n="quota_tatkal">Tatkal Quota (TQ)</option>
                      <option value="PT" data-i18n="quota_ptatkal">Premium Tatkal (PT)</option>
                      <option value="LD" data-i18n="quota_ladies">Ladies Quota (LD)</option>
                      <option value="SS" data-i18n="quota_senior">Senior Citizen (SS)</option>
                      <option value="HP" data-i18n="quota_divyang">Divyangjan (HP)</option>
                    </select>
                  </div>
                  <span class="field-subtext" data-i18n="quota_subtext">General, Tatkal, Ladies, etc.</span>
                </div>
              </div>

              <!-- CTA Search Button -->
              <div class="form-actions" style="margin-top:20px;">
                <button type="submit" id="btn-submit-route" class="btn-hero-search">
                  <span style="font-size:1.1rem;">🔍</span>
                  <span data-i18n="btn_search_trains">Search Trains</span>
                </button>
              </div>

              <!-- Quick Demo Route Button -->
              <div style="display:flex;justify-content:flex-end;margin-top:8px;">
                <button type="button" id="demo-route" class="demo-link-btn" data-i18n="btn_sample_route">Demo Train Route (NDLS ➔ MMCT)</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Quick Shortcuts Row -->
        <div class="quick-shortcuts-row">
          <div class="shortcut-card" id="shortcut-passenger-master" role="button" tabindex="0">
            <div class="shortcut-icon">👤</div>
            <div class="shortcut-info">
              <strong data-i18n="shortcut_passengers_title">Passenger Master</strong>
              <span data-i18n="shortcut_passengers_desc">Save &amp; Auto-fill passengers</span>
            </div>
          </div>

          <div class="shortcut-card" id="shortcut-saved-journeys" role="button" tabindex="0">
            <div class="shortcut-icon">⭐</div>
            <div class="shortcut-info">
              <strong data-i18n="shortcut_saved_title">Saved Journeys</strong>
              <span data-i18n="shortcut_saved_desc">e.g. ADI ➔ LKO, NDLS ➔ MMCT</span>
            </div>
          </div>

          <div class="shortcut-card" id="shortcut-booking-history" role="button" tabindex="0">
            <div class="shortcut-icon">📋</div>
            <div class="shortcut-info">
              <strong data-i18n="shortcut_bookings_title">Booking History</strong>
              <span data-i18n="shortcut_bookings_desc">View assisted bookings</span>
            </div>
          </div>

          <div class="shortcut-card" id="shortcut-pnr-status" role="button" tabindex="0">
            <div class="shortcut-icon">🎫</div>
            <div class="shortcut-info">
              <strong data-i18n="shortcut_pnr_title">Check PNR Status</strong>
              <span data-i18n="shortcut_pnr_desc">Chart status &amp; confirmation</span>
            </div>
          </div>
        </div>

        <!-- Secondary Enquiry Pill Tabs (PNR, Seats, Live Train, Fare) -->
        <div style="margin-top:20px;">
          <div class="secondary-enquiry-bar" role="tablist">
            <button id="tab-pnr" class="secondary-tab-btn" role="tab" aria-selected="false" aria-controls="panel-pnr" type="button">
              <span>🎫</span>
              <span data-i18n="tab_pnr">PNR Status</span>
            </button>
            <button id="tab-seats" class="secondary-tab-btn" role="tab" aria-selected="false" aria-controls="panel-seats" type="button">
              <span>💺</span>
              <span data-i18n="tab_seats">Seat Availability</span>
            </button>
            <button id="tab-train" class="secondary-tab-btn" role="tab" aria-selected="false" aria-controls="panel-train" type="button">
              <span>📍</span>
              <span data-i18n="tab_live">Live Train Running</span>
            </button>
            <button id="tab-fare" class="secondary-tab-btn" role="tab" aria-selected="false" aria-controls="panel-fare" type="button">
              <span>💰</span>
              <span data-i18n="tab_fare">Fare Inquiry</span>
            </button>
          </div>
        </div>

        <!-- Hidden container to keep tab-route button in DOM for backwards compatibility -->
        <button id="tab-route" class="tab-button active" role="tab" aria-selected="true" aria-controls="panel-route" type="button" style="display:none;"></button>
      </section>

      <!-- Central Search Box / Enquiry Card (For PNR, Seats, Live Running, Fare) -->
      <section class="enquiry-card" id="secondary-enquiry-card" style="display:none;">
        <!-- Panel: PNR Enquiry Form -->
        <div id="panel-pnr" class="tab-panel" role="tabpanel" aria-labelledby="tab-pnr">
          <form id="pnr-form" class="search-form" novalidate>
            <div class="form-group-row">
              <div class="field-container">
                <label for="pnr-input" class="field-label">
                  <span data-i18n="lbl_pnr_number">Enter 10-Digit PNR Number</span>
                  <span id="pnr-counter" class="counter-text">0 / 10 digits</span>
                </label>
                <div class="input-wrapper">
                  <span class="input-icon" aria-hidden="true">#</span>
                  <input 
                    id="pnr-input" 
                    type="text" 
                    autocomplete="off" 
                    inputmode="numeric" 
                    pattern="[0-9]{10}" 
                    maxlength="10" 
                    placeholder="e.g. 2451893620" 
                    required 
                  />
                  <button type="button" id="paste-pnr" class="paste-action" title="Paste from clipboard">
                    Paste
                  </button>
                </div>
                <span class="field-subtext" data-i18n="pnr_subtext">10-digit number printed on the top-left of ticket</span>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" id="btn-submit-pnr" class="submit-button">
                <span>🔍</span>
                <span data-i18n="btn_check_pnr">Check PNR Status</span>
              </button>
            </div>

            <div class="demo-bar">
              <button type="button" id="demo-pnr" class="demo-link-btn" data-i18n="btn_demo_pnr">Demo PNR (Sample)</button>
            </div>
          </form>
        </div>

        <!-- Panel: Seats Enquiry Form -->
        <div id="panel-seats" class="tab-panel" role="tabpanel" aria-labelledby="tab-seats">
          <form id="seats-form" class="search-form" novalidate>
            <div class="form-group-row">
              <div class="field-container flex-1">
                <label for="seats-from-input" class="field-label">
                  <span data-i18n="lbl_from_station">From Station</span>
                </label>
                <div class="input-wrapper autocomplete-container">
                  <input id="seats-from-input" type="text" autocomplete="off" placeholder="e.g. NDLS (New Delhi)" required />
                  <div id="seats-from-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="seats-to-input" class="field-label">
                  <span data-i18n="lbl_to_station">To Station</span>
                </label>
                <div class="input-wrapper autocomplete-container">
                  <input id="seats-to-input" type="text" autocomplete="off" placeholder="e.g. MMCT (Mumbai Central)" required />
                  <div id="seats-to-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="seats-date-input" class="field-label">
                  <span data-i18n="lbl_journey_date">Journey Date</span>
                </label>
                <div class="input-wrapper">
                  <input id="seats-date-input" type="date" lang="en-IN" title="Date format: DD-MM-YYYY" required />
                </div>
                <span class="field-subtext" data-i18n="date_format_subtext">Format: DD-MM-YYYY</span>
              </div>
            </div>

            <div class="form-group-row" style="margin-top:12px;">
              <div class="field-container flex-1">
                <label for="seats-train-input" class="field-label">
                  <span data-i18n="lbl_train_optional">Train Number (Optional)</span>
                </label>
                <div class="input-wrapper autocomplete-container">
                  <input id="seats-train-input" type="text" autocomplete="off" placeholder="Optional e.g. 12952" />
                  <div id="seats-train-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="seats-class-select" class="field-label">
                  <span data-i18n="lbl_class">Class</span>
                </label>
                <div class="input-wrapper">
                  <select id="seats-class-select">
                    <option value="ALL" data-i18n="opt_all_classes">All Classes</option>
                    <option value="SL">Sleeper (SL)</option>
                    <option value="3A" selected>AC 3 Tier (3A)</option>
                    <option value="2A">AC 2 Tier (2A)</option>
                    <option value="1A">AC First Class (1A)</option>
                    <option value="3E">AC 3 Economy (3E)</option>
                    <option value="CC">AC Chair Car (CC)</option>
                    <option value="2S">Second Sitting (2S)</option>
                  </select>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="seats-quota-select" class="field-label">
                  <span data-i18n="lbl_quota">Quota</span>
                </label>
                <div class="input-wrapper">
                  <select id="seats-quota-select">
                    <option value="GN" selected data-i18n="quota_general">General Quota (GN)</option>
                    <option value="TQ" data-i18n="quota_tatkal">Tatkal Quota (TQ)</option>
                    <option value="LD" data-i18n="quota_ladies">Ladies Quota (LD)</option>
                    <option value="SS" data-i18n="quota_senior">Senior Citizen (SS)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-actions" style="margin-top:16px;">
              <button type="submit" id="btn-submit-seats" class="submit-button">
                <span>💺</span>
                <span data-i18n="btn_check_seats">Check Seat Availability</span>
              </button>
            </div>

            <div class="demo-bar">
              <button type="button" id="demo-seats" class="demo-link-btn" data-i18n="btn_demo_seats">Demo Seat Availability</button>
            </div>
          </form>
        </div>

        <!-- Panel: Live Train Running Form -->
        <div id="panel-train" class="tab-panel" role="tabpanel" aria-labelledby="tab-train">
          <form id="train-form" class="search-form" novalidate>
            <div class="form-group-row">
              <div class="field-container flex-1">
                <label for="train-number-input" class="field-label">
                  <span data-i18n="lbl_train_num_name">5-Digit Train Number or Name</span>
                  <span id="train-counter" class="counter-text">0 / 5 digits</span>
                </label>
                <div class="input-wrapper autocomplete-container">
                  <input id="train-number-input" type="text" autocomplete="off" placeholder="e.g. 12952 (Rajdhani)" required />
                  <div id="train-search-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="journey-date" class="field-label">
                  <span data-i18n="lbl_start_date">Train Start Date</span>
                </label>
                <div class="input-wrapper">
                  <input id="journey-date" type="date" lang="en-IN" title="Date format: DD-MM-YYYY" required />
                </div>
                <span class="field-subtext" data-i18n="train_date_subtext">Format: DD-MM-YYYY • Departure date</span>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" id="btn-submit-train" class="submit-button">
                <span>📍</span>
                <span data-i18n="btn_track_train">Track Live Running Status</span>
              </button>
            </div>

            <div class="demo-bar">
              <button type="button" id="demo-train" class="demo-link-btn" data-i18n="btn_demo_train">Demo Live Running (12952)</button>
            </div>
          </form>
        </div>

        <!-- Panel: Fare Inquiry Form -->
        <div id="panel-fare" class="tab-panel" role="tabpanel" aria-labelledby="tab-fare">
          <form id="fare-form" class="search-form" novalidate>
            <div class="form-group-row">
              <div class="field-container flex-1">
                <label for="fare-train-input" class="field-label" data-i18n="lbl_train_number">Train Number</label>
                <div class="input-wrapper autocomplete-container">
                  <input id="fare-train-input" type="text" autocomplete="off" placeholder="e.g. 12952" required />
                  <div id="fare-train-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="fare-from-input" class="field-label" data-i18n="lbl_from_station">From Station</label>
                <div class="input-wrapper autocomplete-container">
                  <input id="fare-from-input" type="text" autocomplete="off" placeholder="e.g. NDLS" required />
                  <div id="fare-from-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="fare-to-input" class="field-label" data-i18n="lbl_to_station">To Station</label>
                <div class="input-wrapper autocomplete-container">
                  <input id="fare-to-input" type="text" autocomplete="off" placeholder="e.g. MMCT" required />
                  <div id="fare-to-suggestions" class="autocomplete-dropdown" hidden></div>
                </div>
              </div>

              <div class="field-container flex-1">
                <label for="fare-date-input" class="field-label" data-i18n="lbl_journey_date">Journey Date</label>
                <div class="input-wrapper">
                  <input id="fare-date-input" type="date" lang="en-IN" title="Date format: DD-MM-YYYY" required />
                </div>
                <span class="field-subtext" data-i18n="date_format_subtext">Format: DD-MM-YYYY</span>
              </div>
            </div>

            <div class="form-actions" style="margin-top:16px;">
              <button type="submit" id="btn-submit-fare" class="submit-button">
                <span>💰</span>
                <span data-i18n="btn_check_fare">Check Fare Breakdown</span>
              </button>
            </div>

            <div class="demo-bar">
              <button type="button" id="demo-fare" class="demo-link-btn" data-i18n="btn_demo_fare">Demo Fare (12952)</button>
            </div>
          </form>
        </div>
      </section>

      <!-- Feedback / Alert Notifications -->
      <div id="feedback" class="feedback-banner" role="alert" hidden>
        <span class="feedback-icon" aria-hidden="true">ℹ</span>
        <span id="feedback-message" class="feedback-text"></span>
        <button type="button" id="feedback-close" class="feedback-close" aria-label="Close message">✕</button>
      </div>

      <!-- Results Display Container -->
      <section id="result" class="result-area" aria-live="polite" hidden></section>

      <!-- Important Railway Rules & Info Section -->
      <section class="info-section">
        <h3 data-i18n="info_heading">Important Railway Rules &amp; Information</h3>
        <div class="info-grid">
          <div class="info-card">
            <h4><span class="info-icon">📄</span> <span data-i18n="info_pnr_title">PNR &amp; Seat Indicators</span></h4>
            <ul class="info-list">
              <li><strong>CNF (Confirmed):</strong> <span data-i18n="info_cnf">Seat is confirmed, coach and berth are allocated.</span></li>
              <li><strong>RAC (Reservation Against Cancellation):</strong> <span data-i18n="info_rac">Guaranteed travel; share a lower berth.</span></li>
              <li><strong>WL (Waitlist):</strong> <span data-i18n="info_wl">Ticket in waiting; confirmable upon cancellations before charting.</span></li>
              <li><strong>Tatkal Quota (TQ):</strong> <span data-i18n="info_tq">Opens 1 day before journey at 10:00 AM (AC) &amp; 11:00 AM (Non-AC).</span></li>
            </ul>
          </div>

          <div class="info-card">
            <h4><span class="info-icon">🕒</span> <span data-i18n="info_chart_title">Charting &amp; Helpline</span></h4>
            <ul class="info-list">
              <li><strong>First Chart:</strong> <span data-i18n="info_first_chart">Prepared approx 4 hours before train departure from origin.</span></li>
              <li><strong>Second Chart:</strong> <span data-i18n="info_second_chart">Finalized approx 30 minutes before departure.</span></li>
              <li><strong>Railway Helpline:</strong> <span data-i18n="info_helpline">Dial <strong>139</strong> (24x7 all India toll-free).</span></li>
              <li><strong>Official Booking:</strong> <span data-i18n="info_official">Confirmed bookings &amp; payments take place on official portal (irctc.co.in).</span></li>
            </ul>
          </div>
        </div>

        <div class="disclaimer-banner">
          <span class="disclaimer-icon">ℹ</span>
          <p>
            <strong>Disclaimer:</strong> RailPlus is an independent travel enquiry and booking-assistance utility. It is not directly affiliated with Indian Railways, IRCTC, or CRIS. Confirmed reservations, cancellations, and payments are executed on the official IRCTC portal (<a href="https://www.irctc.co.in/" target="_blank" rel="noopener noreferrer">irctc.co.in</a>) or NTES (<a href="https://enquiry.indianrail.gov.in/ntes/" target="_blank" rel="noopener noreferrer">enquiry.indianrail.gov.in</a>).
          </p>
        </div>
      </section>

    </div>
  </main>

  <!-- Multi-Step Booking Assistance Flow Modal -->
  <div id="booking-flow-modal" class="booking-modal-overlay" hidden>
    <div class="booking-modal-card">
      <div class="modal-header-irctc">
        <h3 id="booking-modal-header-title">
          <span>🚆</span>
          <span data-i18n="booking_modal_title">Train Ticket Booking Assistance</span>
        </h3>
        <button type="button" id="btn-close-booking-modal" class="modal-close-btn" aria-label="Close">✕</button>
      </div>

      <!-- Steps Indicator -->
      <div class="booking-steps-bar">
        <div class="booking-step-item active" id="bstep-1">1. <span data-i18n="step_train">Train</span></div>
        <div class="booking-step-item" id="bstep-2">2. <span data-i18n="step_passengers">Passengers</span></div>
        <div class="booking-step-item" id="bstep-3">3. <span data-i18n="step_review">Review</span></div>
        <div class="booking-step-item" id="bstep-4">4. <span data-i18n="step_irctc">IRCTC Handoff</span></div>
      </div>

      <div class="modal-body-scroll">
        <!-- Step 1 & 2: Selected Train & Passenger Selection -->
        <div id="booking-step-content-main">
          <div class="journey-summary-box" id="booking-train-summary">
            <!-- Rendered dynamically -->
          </div>

          <h4 style="margin:12px 0 8px;font-size:0.95rem;color:var(--text-main);display:flex;justify-content:space-between;align-items:center;">
            <span data-i18n="select_passengers_title">Select Passengers (Max 6)</span>
            <button type="button" id="btn-quick-add-pax" class="demo-link-btn" style="font-size:0.75rem;" data-i18n="btn_add_new_passenger">+ Add New Passenger</button>
          </h4>

          <div id="booking-passenger-selection-list" class="passenger-pick-list">
            <!-- Rendered from Passenger Master -->
          </div>

          <!-- Inline Quick Add Passenger Form (Collapsible) -->
          <div id="quick-add-pax-box" style="display:none;background:var(--bg-card-subtle);border:1px solid var(--border-light);border-radius:8px;padding:12px;margin-bottom:14px;">
            <h5 style="margin-bottom:8px;font-size:0.85rem;" data-i18n="quick_add_title">Add Passenger Details</h5>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <input id="qadd-name" type="text" placeholder="Full Name (as on ID)" style="padding:6px 10px;border:1px solid var(--border-light);border-radius:4px;" />
              <input id="qadd-age" type="number" min="1" max="125" placeholder="Age" style="padding:6px 10px;border:1px solid var(--border-light);border-radius:4px;" />
              <select id="qadd-gender" style="padding:6px 10px;border:1px solid var(--border-light);border-radius:4px;">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
              </select>
              <select id="qadd-berth" style="padding:6px 10px;border:1px solid var(--border-light);border-radius:4px;">
                <option value="No Preference">No Berth Preference</option>
                <option value="Lower">Lower Berth</option>
                <option value="Middle">Middle Berth</option>
                <option value="Upper">Upper Berth</option>
                <option value="Side Lower">Side Lower</option>
                <option value="Side Upper">Side Upper</option>
                <option value="Window Seat">Window Seat</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
              <button type="button" id="btn-cancel-qadd" class="filter-pill" data-i18n="btn_cancel">Cancel</button>
              <button type="button" id="btn-save-qadd" class="btn-search-saved-route" data-i18n="btn_save_pax">Save &amp; Select</button>
            </div>
          </div>
        </div>

        <!-- Step 3: Review & IRCTC Handoff Box -->
        <div id="booking-handoff-section" style="display:none;">
          <div class="journey-summary-box" id="booking-final-review">
            <!-- Review Details -->
          </div>

          <div class="irctc-handoff-banner">
            <h4 data-i18n="irctc_assist_heading">Ready for IRCTC Booking</h4>
            <p data-i18n="irctc_assist_desc">
              RailPlus has organized and validated your journey and passenger data. Click below to copy your passenger list and proceed directly to the official IRCTC portal to complete reservation and secure payment.
            </p>
            <div class="handoff-actions">
              <button type="button" id="btn-copy-pax-clipboard" class="btn-copy-passenger-details">
                📋 <span data-i18n="btn_copy_pax">Copy Passenger Details</span>
              </button>
              <a href="https://www.irctc.co.in/nget/booking/train-list" target="_blank" rel="noopener noreferrer" id="btn-launch-irctc" class="btn-proceed-irctc">
                <span>🚀</span> <span data-i18n="btn_proceed_irctc">Proceed to Official IRCTC (irctc.co.in) ➔</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="pwa-modal-footer" style="padding:12px 20px;border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;">
        <button type="button" id="btn-booking-back" class="filter-pill" style="display:none;" data-i18n="btn_back">← Back</button>
        <button type="button" id="btn-booking-proceed" class="submit-button" style="margin-left:auto;height:40px;padding:0 24px;" data-i18n="btn_review_continue">Review &amp; Continue ➔</button>
      </div>
    </div>
  </div>

  <!-- Passenger Master Management Modal -->
  <div id="passenger-master-modal" class="passenger-modal-overlay" hidden>
    <div class="passenger-modal-card">
      <div class="modal-header-irctc">
        <h3>
          <span>👤</span>
          <span data-i18n="passenger_master_title">Passenger Master</span>
        </h3>
        <button type="button" id="btn-close-passenger-modal" class="modal-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="modal-body-scroll">
        <!-- Add Passenger Form -->
        <form id="add-passenger-form" style="background:var(--bg-card-subtle);border:1px solid var(--border-light);border-radius:10px;padding:16px;margin-bottom:18px;">
          <h4 style="margin-bottom:12px;font-size:0.95rem;" data-i18n="add_passenger_heading">Add New Passenger</h4>
          
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div>
              <label class="field-label" data-i18n="lbl_pax_name">Full Name (as per Govt ID)</label>
              <input id="pm-name" type="text" required placeholder="e.g. Ramesh Kumar" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="field-label" data-i18n="lbl_pax_age">Age</label>
                <input id="pm-age" type="number" min="1" max="125" required placeholder="Age" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);" />
              </div>
              <div>
                <label class="field-label" data-i18n="lbl_pax_gender">Gender</label>
                <select id="pm-gender" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);">
                  <option value="Male" data-i18n="gender_male">Male</option>
                  <option value="Female" data-i18n="gender_female">Female</option>
                  <option value="Transgender" data-i18n="gender_trans">Transgender</option>
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="field-label" data-i18n="lbl_pax_berth">Berth Preference</label>
                <select id="pm-berth" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);">
                  <option value="No Preference">No Preference</option>
                  <option value="Lower">Lower Berth</option>
                  <option value="Middle">Middle Berth</option>
                  <option value="Upper">Upper Berth</option>
                  <option value="Side Lower">Side Lower</option>
                  <option value="Side Upper">Side Upper</option>
                  <option value="Window Seat">Window Seat</option>
                </select>
              </div>
              <div>
                <label class="field-label" data-i18n="lbl_pax_food">Food Preference</label>
                <select id="pm-food" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);">
                  <option value="Veg" data-i18n="food_veg">Vegetarian</option>
                  <option value="Non-Veg" data-i18n="food_nonveg">Non-Vegetarian</option>
                  <option value="No Food" data-i18n="food_none">No Food</option>
                </select>
              </div>
            </div>

            <div>
              <label class="field-label" data-i18n="lbl_pax_nickname">Optional Nickname / Label</label>
              <input id="pm-nickname" type="text" placeholder="e.g. Self, Mom, Friend" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);" />
            </div>

            <div style="margin-top:6px;">
              <button type="submit" class="submit-button" style="width:100%;height:40px;" data-i18n="btn_save_passenger_master">Save Passenger</button>
            </div>
          </div>
        </form>

        <h4 style="margin:16px 0 10px;font-size:0.95rem;" data-i18n="saved_passengers_list_title">Saved Passengers</h4>
        <div id="passenger-master-items-list">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>
  </div>

  <!-- Station Master & Saved Journeys Modal -->
  <div id="saved-journeys-modal" class="journeys-modal-overlay" hidden>
    <div class="journeys-modal-card">
      <div class="modal-header-irctc">
        <h3>
          <span>⭐</span>
          <span data-i18n="saved_journeys_title">Saved Journeys &amp; Favorite Routes</span>
        </h3>
        <button type="button" id="btn-close-journeys-modal" class="modal-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="modal-body-scroll">
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px;" data-i18n="saved_journeys_intro">
          Access your frequently traveled railway routes for instant 1-click train search.
        </p>

        <div id="saved-journeys-items-list">
          <!-- Saved journeys rendered here -->
        </div>

        <form id="add-saved-journey-form" style="background:var(--bg-card-subtle);border:1px solid var(--border-light);border-radius:8px;padding:14px;margin-top:16px;">
          <h4 style="font-size:0.9rem;margin-bottom:10px;" data-i18n="add_favorite_route_title">Add Favorite Route</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            <input id="add-route-from" type="text" placeholder="From (e.g. ADI)" required style="padding:6px 10px;border:1px solid var(--border-light);border-radius:4px;background:var(--bg-card);" />
            <input id="add-route-to" type="text" placeholder="To (e.g. LKO)" required style="padding:6px 10px;border:1px solid var(--border-light);border-radius:4px;background:var(--bg-card);" />
          </div>
          <button type="submit" class="submit-button" style="width:100%;height:38px;" data-i18n="btn_add_favorite_route">Save Route</button>
        </form>
      </div>
    </div>
  </div>

  <!-- User Dashboard Modal -->
  <div id="user-dashboard-modal" class="dashboard-modal-overlay" hidden>
    <div class="dashboard-modal-card">
      <div class="modal-header-irctc">
        <h3>
          <span>👤</span>
          <span data-i18n="dashboard_title">User Dashboard</span>
        </h3>
        <button type="button" id="btn-close-dashboard-modal" class="modal-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="modal-body-scroll">
        <!-- Quick Stats -->
        <div class="dashboard-grid-stats">
          <div class="dash-stat-box">
            <strong id="stat-passengers-count">0</strong>
            <span data-i18n="stat_passengers">Saved Passengers</span>
          </div>
          <div class="dash-stat-box">
            <strong id="stat-journeys-count">0</strong>
            <span data-i18n="stat_routes">Saved Routes</span>
          </div>
          <div class="dash-stat-box">
            <strong id="stat-bookings-count">0</strong>
            <span data-i18n="stat_bookings">Assisted Bookings</span>
          </div>
        </div>

        <!-- Dashboard Menu -->
        <div class="dash-menu-list">
          <div class="dash-menu-item" id="dash-link-passengers">
            <span>👤 <span data-i18n="menu_passengers">Passenger Master Management</span></span>
            <span>➔</span>
          </div>
          <div class="dash-menu-item" id="dash-link-journeys">
            <span>⭐ <span data-i18n="menu_journeys">Saved Journeys &amp; Favorite Routes</span></span>
            <span>➔</span>
          </div>
          <div class="dash-menu-item" id="dash-link-bookings">
            <span>📋 <span data-i18n="menu_history">Booking Assistance History</span></span>
            <span>➔</span>
          </div>
          <div class="dash-menu-item" id="dash-link-install">
            <span>📲 <span data-i18n="menu_install_app">Install RailPlus Web App</span></span>
            <span>➔</span>
          </div>
          <div class="dash-menu-item" id="dash-link-cleardata" style="color:#ef4444;">
            <span>🗑️ <span data-i18n="menu_clear_data">Reset / Clear All Saved Data</span></span>
            <span>✕</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-brand-col">
        <div class="footer-logo">
          <img src="logo.png" alt="RailPlus" />
          <span>Rail <strong>Plus</strong></span>
        </div>
        <p data-i18n="footer_desc">
          Official IRCTC-inspired train ticket booking assistance, live status, PNR verification, and seat availability platform for Indian Railways passengers.
        </p>
      </div>

      <div class="footer-links-col">
        <h4 data-i18n="footer_useful_links">Useful Links</h4>
        <ul>
          <li><a href="https://www.indianrail.gov.in/" target="_blank" rel="noopener noreferrer">Indian Railways Official Portal</a></li>
          <li><a href="https://www.irctc.co.in/" target="_blank" rel="noopener noreferrer">IRCTC Next-Gen E-Ticketing</a></li>
          <li><a href="https://enquiry.indianrail.gov.in/ntes/" target="_blank" rel="noopener noreferrer">NTES National Train Enquiry System</a></li>
        </ul>
      </div>

      <div class="footer-links-col">
        <h4 data-i18n="footer_helpline_security">Helpline &amp; Privacy</h4>
        <ul>
          <li><span data-i18n="footer_helpline">Railway Helpline: <strong>139</strong></span></li>
          <li><span data-i18n="footer_privacy">Data Privacy: No Aadhaar or Passwords stored</span></li>
          <li><span data-i18n="footer_encryption">Secure HTTPS Encryption</span></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom-bar" style="text-align:center;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.75rem;color:#94a3b8;">
      <span>© 2026 RailPlus.in. All Rights Reserved. Trademarks belong to their respective owners.</span>
    </div>
  </footer>

  <script src="config.js?v=17.0"></script>
  <script src="app.js?v=17.0"></script>
</body>
</html>
`;

fs.writeFileSync('website/index.html', htmlContent);
console.log('Successfully wrote modern IRCTC website/index.html');
