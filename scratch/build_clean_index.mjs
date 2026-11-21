import fs from 'fs';

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0f294a" />
  <meta name="description" content="RailPlus — IRCTC-inspired Indian Railway Booking Assistance, PNR Status, Seat Availability & Live Train Tracking" />
  <title>RailPlus — IRCTC-Inspired Indian Railway Ticket Booking &amp; Live Enquiry</title>
  
  <link rel="icon" type="image/png" href="logo.png" />
  <link rel="apple-touch-icon" href="icon-192.png" />
  <link rel="manifest" href="manifest.webmanifest" />

  <!-- Google Fonts for crisp typography (Inter & Hindi Noto Sans) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="styles.css?v=20.0" />
</head>
<body>

  <!-- PWA Manual Guide Modal (Only shown if user explicitly clicks install on an unsupported browser) -->
  <div id="pwa-guide-modal" class="pwa-modal-overlay" hidden>
    <div class="pwa-modal-card">
      <div class="pwa-modal-header">
        <div class="pwa-brand-icon">
          <img src="logo.png" alt="RailPlus" style="width:28px;height:28px;object-fit:contain;background:#ffffff;border-radius:4px;padding:2px;" />
        </div>
        <h3 data-i18n="install_app_title">Install RailPlus App</h3>
        <button type="button" id="btn-close-pwa-modal" class="modal-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="pwa-modal-body">
        <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:16px;">
          Install RailPlus on your phone or computer for fast, one-tap access:
        </p>
        <div class="pwa-instruction-steps">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text">
              <strong data-i18n="install_step_1_title">Open Browser Menu</strong>
              <p data-i18n="install_step_1_desc">Tap the three dots (⋮) in Chrome or the Share button in Safari.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text">
              <strong data-i18n="install_step_2_title">Select Install or Add to Home</strong>
              <p data-i18n="install_step_2_desc">Choose "Install RailPlus" or "Add to Home Screen".</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text">
              <strong data-i18n="install_step_3_title">Enjoy Native App Experience</strong>
              <p data-i18n="install_step_3_desc">Launch RailPlus directly from your home screen.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="pwa-modal-footer">
        <button type="button" id="btn-understood-pwa" class="submit-button" style="height:38px;padding:0 24px;" data-i18n="btn_got_it">Got it</button>
      </div>
    </div>
  </div>

  <!-- Main Website Header (Navy Blue & Orange IRCTC Theme) -->
  <header class="site-header">
    <div class="header-inner">
      <div class="header-brand">
        <a href="#home" class="logo-link" id="brand-logo-btn" title="RailPlus — Home / Reset">
          <div class="logo-symbol">
            <img src="logo.png" alt="RailPlus Logo" class="brand-logo-img" />
          </div>
          <div class="brand-details">
            <span class="brand-title">Rail<strong>Plus</strong></span>
            <span class="brand-subtitle" data-i18n="header_subtitle">Indian Railway Travel &amp; Booking Portal</span>
          </div>
        </a>
      </div>

      <!-- Navigation Links -->
      <nav class="header-nav-links" aria-label="Main Navigation">
        <a href="#pnr" id="nav-pnr" class="nav-item">
          <span>🎫</span> <span data-i18n="nav_pnr">PNR Status</span>
        </a>
        <a href="#search" id="nav-train-search" class="nav-item">
          <span>🚆</span> <span data-i18n="nav_train_search">Train Search</span>
        </a>
        <a href="#live" id="nav-live" class="nav-item">
          <span>📍</span> <span data-i18n="nav_live">Live Status</span>
        </a>
        <button type="button" id="nav-btn-passengers" class="nav-item-btn">
          <span>👤</span> <span data-i18n="nav_passengers">Passenger Master</span>
        </button>
        <button type="button" id="nav-btn-journeys" class="nav-item-btn">
          <span>⭐</span> <span data-i18n="nav_journeys">Saved Journeys</span>
        </button>
      </nav>

      <!-- Header Utilities (Language Switcher, Theme Toggle, Single Install Button, Dashboard) -->
      <div class="header-actions">
        <!-- Multilanguage Dropdown -->
        <div class="lang-selector-wrapper">
          <span style="font-size:0.9rem;" aria-hidden="true">🌐</span>
          <select id="lang-selector" class="lang-select" aria-label="Select Language">
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>

        <!-- Dark/Light Mode Toggle -->
        <button type="button" id="btn-theme-toggle" class="header-action-btn theme-toggle-btn" title="Toggle Dark/Light Mode" aria-label="Toggle Theme">
          🌙
        </button>

        <!-- Controlled PWA Install Button (Only 1 visible install location) -->
        <button type="button" id="header-install-btn" class="header-install-action" title="Install RailPlus PWA">
          <span>📲</span>
          <span data-i18n="btn_install_app">Install App</span>
        </button>

        <!-- User Dashboard Button -->
        <button type="button" id="btn-open-dashboard" class="header-action-btn dashboard-icon-btn" title="User Dashboard" aria-label="Open User Dashboard">
          <span>👤</span>
          <span class="desktop-only-text" data-i18n="btn_dashboard">Dashboard</span>
        </button>

        <!-- Mobile Menu Hamburger -->
        <button type="button" id="btn-mobile-menu" class="mobile-menu-toggle" aria-label="Open Menu">
          ☰
        </button>
      </div>
    </div>
  </header>

  <main class="page-main" id="home">
    <div class="content-container">

      <!-- Unified Main Booking & Enquiry Card (IRCTC Unified Interface) -->
      <section class="hero-booking-section">
        <div class="hero-booking-card" id="main-booking-enquiry-card">

          <!-- 5 Primary Tabs: PNR Status (ALWAYS FIRST!), Train Search, Seats, Live Status, Fare -->
          <div class="main-tabs-header" role="tablist">
            <button id="tab-pnr" class="main-tab-btn active" role="tab" aria-selected="true" aria-controls="panel-pnr" type="button">
              <span class="tab-icon">🎫</span>
              <span class="tab-label" data-i18n="tab_pnr">PNR Status</span>
            </button>
            <button id="tab-route" class="main-tab-btn" role="tab" aria-selected="false" aria-controls="panel-route" type="button">
              <span class="tab-icon">🚆</span>
              <span class="tab-label" data-i18n="nav_train_search">Train Search</span>
            </button>
            <button id="tab-seats" class="main-tab-btn" role="tab" aria-selected="false" aria-controls="panel-seats" type="button">
              <span class="tab-icon">💺</span>
              <span class="tab-label" data-i18n="tab_seats">Seat Availability</span>
            </button>
            <button id="tab-train" class="main-tab-btn" role="tab" aria-selected="false" aria-controls="panel-train" type="button">
              <span class="tab-icon">📍</span>
              <span class="tab-label" data-i18n="tab_live">Live Train Running</span>
            </button>
            <button id="tab-fare" class="main-tab-btn" role="tab" aria-selected="false" aria-controls="panel-fare" type="button">
              <span class="tab-icon">💰</span>
              <span class="tab-label" data-i18n="tab_fare">Fare Enquiry</span>
            </button>
          </div>

          <div class="hero-booking-body">

            <!-- PANEL 1: PNR Status Form (ALWAYS FIRST & ACTIVE ON LOAD) -->
            <div id="panel-pnr" class="tab-panel active" role="tabpanel" aria-labelledby="tab-pnr">
              <form id="pnr-form" class="search-form" novalidate>
                <div class="panel-intro-header">
                  <h3>Check Passenger Name Record (PNR) Status</h3>
                  <p>Get real-time railway confirmation status, coach, berth, and final chart preparation details.</p>
                </div>

                <div class="form-group-row">
                  <div class="field-container flex-1">
                    <label for="pnr-input" class="field-label">
                      <span data-i18n="lbl_pnr_number">Enter 10-Digit PNR Number</span>
                      <span id="pnr-counter" class="counter-text">0 / 10 digits</span>
                    </label>
                    <div class="input-wrapper" style="position:relative;">
                      <span class="input-icon" aria-hidden="true">🎫</span>
                      <input 
                        id="pnr-input" 
                        type="text" 
                        autocomplete="off" 
                        inputmode="numeric" 
                        pattern="[0-9]{10}" 
                        maxlength="10" 
                        placeholder="e.g. 2451893620" 
                        required 
                        style="font-size:1.15rem;font-weight:700;letter-spacing:1px;padding-right:80px;"
                      />
                      <button type="button" id="paste-pnr" class="paste-action" title="Paste from clipboard">
                        Paste
                      </button>
                    </div>
                    <span class="field-subtext" data-i18n="pnr_subtext">Printed on the top-left corner of your railway ticket</span>
                  </div>
                </div>

                <div class="form-actions" style="margin-top:16px;">
                  <button type="submit" id="btn-submit-pnr" class="btn-hero-search">
                    <span style="font-size:1.1rem;">🔍</span>
                    <span data-i18n="btn_check_pnr">Check PNR Status</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- PANEL 2: Train Search (Route) Form -->
            <div id="panel-route" class="tab-panel" role="tabpanel" aria-labelledby="tab-route" hidden>
              <form id="route-form" class="search-form" novalidate>
                <div class="panel-intro-header">
                  <h3 data-i18n="hero_booking_title">Search &amp; Book Trains</h3>
                  <p>Search all direct trains between stations, check real-time availability, and proceed to booking.</p>
                </div>

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
              </form>
            </div>

            <!-- PANEL 3: Seat Availability Form -->
            <div id="panel-seats" class="tab-panel" role="tabpanel" aria-labelledby="tab-seats" hidden>
              <form id="seats-form" class="search-form" novalidate>
                <div class="panel-intro-header">
                  <h3 data-i18n="tab_seats">Check Seat Availability</h3>
                  <p>View confirmed, RAC, and waiting list seats across Sleeper and AC classes.</p>
                </div>

                <div class="station-row-wrapper">
                  <div class="station-input-col field-container flex-1">
                    <label for="seats-from-input" class="field-label">
                      <span data-i18n="lbl_from_station">From Station</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">📍</span>
                      <input 
                        id="seats-from-input" 
                        class="station-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        placeholder="e.g. NDLS (New Delhi)" 
                        data-i18n-ph="ph_from_station"
                        required 
                      />
                      <div id="seats-from-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                  </div>

                  <button type="button" id="swap-seats-stations" class="btn-station-swap" title="Interchange Stations" aria-label="Swap Stations">
                    ⇄
                  </button>

                  <div class="station-input-col field-container flex-1">
                    <label for="seats-to-input" class="field-label">
                      <span data-i18n="lbl_to_station">To Station</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">🏁</span>
                      <input 
                        id="seats-to-input" 
                        class="station-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        placeholder="e.g. MMCT (Mumbai Central)" 
                        data-i18n-ph="ph_to_station"
                        required 
                      />
                      <div id="seats-to-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                  </div>
                </div>

                <div class="form-group-row" style="margin-top:16px;">
                  <div class="field-container flex-1">
                    <label for="seats-date-input" class="field-label">
                      <span data-i18n="lbl_journey_date">Journey Date</span>
                    </label>
                    <div class="input-wrapper">
                      <input id="seats-date-input" type="date" lang="en-IN" required />
                    </div>
                  </div>

                  <div class="field-container flex-1">
                    <label for="seats-train-input" class="field-label">
                      <span data-i18n="lbl_train_optional">Train Number (Optional)</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">🚆</span>
                      <input 
                        id="seats-train-input" 
                        class="train-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        placeholder="e.g. 12952 (Optional Filter)" 
                        maxlength="5" 
                      />
                      <div id="seats-train-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                  </div>

                  <div class="field-container flex-1">
                    <label for="seats-class-select" class="field-label">
                      <span data-i18n="lbl_class">Class</span>
                    </label>
                    <div class="input-wrapper">
                      <select id="seats-class-select">
                        <option value="" data-i18n="opt_all_classes">All Classes (सभी क्लास)</option>
                        <option value="SL">Sleeper (SL)</option>
                        <option value="3A">AC 3 Tier (3A)</option>
                        <option value="2A">AC 2 Tier (2A)</option>
                        <option value="1A">AC First Class (1A)</option>
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
                        <option value="PT" data-i18n="quota_ptatkal">Premium Tatkal (PT)</option>
                        <option value="LD" data-i18n="quota_ladies">Ladies Quota (LD)</option>
                        <option value="SS" data-i18n="quota_senior">Senior Citizen (SS)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="form-actions" style="margin-top:20px;">
                  <button type="submit" id="btn-submit-seats" class="btn-hero-search">
                    <span style="font-size:1.1rem;">🔍</span>
                    <span data-i18n="btn_check_seats">Check Seat Availability</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- PANEL 4: Live Train Running Form -->
            <div id="panel-train" class="tab-panel" role="tabpanel" aria-labelledby="tab-train" hidden>
              <form id="train-form" class="search-form" novalidate>
                <div class="panel-intro-header">
                  <h3 data-i18n="tab_live">Live Train Running Status</h3>
                  <p>Track exact train location, delay in minutes, platform number, and upcoming station stops.</p>
                </div>

                <div class="form-group-row">
                  <div class="field-container flex-1">
                    <label for="train-number-input" class="field-label">
                      <span data-i18n="lbl_train_num_name">Train Number or Name</span>
                      <span id="train-counter" class="counter-text">0 / 5</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">🚆</span>
                      <input 
                        id="train-number-input" 
                        class="train-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        inputmode="numeric" 
                        placeholder="e.g. 12952 (Tejas Rajdhani)" 
                        required 
                      />
                      <div id="train-number-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                    <span class="field-subtext">5-digit train number or partial train name</span>
                  </div>

                  <div class="field-container flex-1">
                    <label for="journey-date" class="field-label">
                      <span data-i18n="lbl_start_date">Train Start Date</span>
                    </label>
                    <div class="input-wrapper">
                      <input id="journey-date" type="date" lang="en-IN" required />
                    </div>
                    <span class="field-subtext" data-i18n="train_date_subtext">Today or up to 5 days back</span>
                  </div>
                </div>

                <div class="form-actions" style="margin-top:20px;">
                  <button type="submit" id="btn-submit-train" class="btn-hero-search">
                    <span style="font-size:1.1rem;">📍</span>
                    <span data-i18n="btn_track_train">Track Live Train</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- PANEL 5: Fare Enquiry Form -->
            <div id="panel-fare" class="tab-panel" role="tabpanel" aria-labelledby="tab-fare" hidden>
              <form id="fare-form" class="search-form" novalidate>
                <div class="panel-intro-header">
                  <h3 data-i18n="tab_fare">Train Fare Table &amp; Breakdown</h3>
                  <p>Detailed fare breakdown including base fare, reservation fee, and superfast charges.</p>
                </div>

                <div class="form-group-row">
                  <div class="field-container flex-1">
                    <label for="fare-train-input" class="field-label">
                      <span data-i18n="lbl_train_number">Train Number</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">🚆</span>
                      <input 
                        id="fare-train-input" 
                        class="train-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        placeholder="e.g. 12952" 
                        maxlength="5" 
                        required 
                      />
                      <div id="fare-train-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                  </div>

                  <div class="field-container flex-1">
                    <label for="fare-date-input" class="field-label">
                      <span data-i18n="lbl_journey_date">Journey Date</span>
                    </label>
                    <div class="input-wrapper">
                      <input id="fare-date-input" type="date" lang="en-IN" required />
                    </div>
                  </div>
                </div>

                <div class="station-row-wrapper" style="margin-top:14px;">
                  <div class="station-input-col field-container flex-1">
                    <label for="fare-from-input" class="field-label">
                      <span data-i18n="lbl_from_station">From Station</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">📍</span>
                      <input 
                        id="fare-from-input" 
                        class="station-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        placeholder="e.g. NDLS (New Delhi)" 
                        data-i18n-ph="ph_from_station"
                        required 
                      />
                      <div id="fare-from-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                  </div>

                  <button type="button" id="swap-fare-stations" class="btn-station-swap" title="Interchange Stations" aria-label="Swap Stations">
                    ⇄
                  </button>

                  <div class="station-input-col field-container flex-1">
                    <label for="fare-to-input" class="field-label">
                      <span data-i18n="lbl_to_station">To Station</span>
                    </label>
                    <div class="input-wrapper autocomplete-container">
                      <span class="input-icon">🏁</span>
                      <input 
                        id="fare-to-input" 
                        class="station-autocomplete" 
                        type="text" 
                        autocomplete="off" 
                        placeholder="e.g. MMCT (Mumbai Central)" 
                        data-i18n-ph="ph_to_station"
                        required 
                      />
                      <div id="fare-to-suggestions" class="autocomplete-dropdown" hidden></div>
                    </div>
                  </div>
                </div>

                <div class="form-actions" style="margin-top:20px;">
                  <button type="submit" id="btn-submit-fare" class="btn-hero-search">
                    <span style="font-size:1.1rem;">💰</span>
                    <span data-i18n="btn_check_fare">Check Fare Table</span>
                  </button>
                </div>
              </form>
            </div>

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
      </section>

      <!-- Feedback / Alert Notifications -->
      <div id="feedback" class="feedback-banner" role="alert" hidden>
        <span class="feedback-icon" aria-hidden="true">ℹ</span>
        <span id="feedback-message" class="feedback-text"></span>
        <button type="button" id="feedback-close" class="feedback-close" aria-label="Close message">✕</button>
      </div>

      <!-- Results Display Container -->
      <section id="result" class="result-area" aria-live="polite" hidden></section>

      <!-- Indian Railways Guidelines & Help Info -->
      <section class="info-section">
        <h3 class="info-title" data-i18n="info_heading">Important Indian Railways Information</h3>
        <div class="info-grid">
          <div class="info-card">
            <h4 data-i18n="info_pnr_title">PNR Status Codes &amp; Meanings</h4>
            <ul>
              <li><strong>CNF:</strong> <span data-i18n="info_cnf">Confirmed booking with allotted coach and berth.</span></li>
              <li><strong>RAC:</strong> <span data-i18n="info_rac">Reservation Against Cancellation — guaranteed boarding.</span></li>
              <li><strong>WL:</strong> <span data-i18n="info_wl">Waiting List ticket — confirmable upon cancellation.</span></li>
              <li><strong>TQ:</strong> <span data-i18n="info_tq">Tatkal waiting list (zero refund upon cancellation if confirmed).</span></li>
            </ul>
          </div>
          <div class="info-card">
            <h4 data-i18n="info_chart_title">Chart Preparation Timeline</h4>
            <ul>
              <li data-i18n="info_first_chart">First Chart: Prepared approx. 4 hours prior to train departure.</li>
              <li data-i18n="info_second_chart">Final Chart: Prepared ~30 minutes prior from charting station.</li>
              <li data-i18n="info_helpline">Railway Helpline: Dial 139 for 24x7 security &amp; medical assistance.</li>
              <li data-i18n="info_official">Authorized Partner: Prepares journey details and hands off to IRCTC portal.</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- ========================================================================= -->
  <!-- MODALS SECTION -->
  <!-- ========================================================================= -->

  <!-- 1. Booking Assistance & IRCTC Handoff Flow Modal -->
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
            <button type="button" id="btn-quick-add-pax" class="btn-link-action" style="font-size:0.8rem;background:none;border:none;color:#ea580c;font-weight:700;cursor:pointer;" data-i18n="btn_add_new_passenger">+ Add New Passenger</button>
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

  <!-- 2. Passenger Master Management Modal -->
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
                <label class="field-label" data-i18n="lbl_pax_age">Age (Years)</label>
                <input id="pm-age" type="number" min="1" max="125" required placeholder="Age" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);" />
              </div>
              <div>
                <label class="field-label" data-i18n="lbl_pax_gender">Gender</label>
                <select id="pm-gender" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);">
                  <option value="Male" data-i18n="gender_male">Male (पुरुष)</option>
                  <option value="Female" data-i18n="gender_female">Female (महिला)</option>
                  <option value="Transgender" data-i18n="gender_trans">Transgender (ट्रांसजेंडर)</option>
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
                  <option value="Veg" data-i18n="food_veg">Vegetarian (शाकाहारी)</option>
                  <option value="NonVeg" data-i18n="food_nonveg">Non-Vegetarian (मांसाहारी)</option>
                  <option value="NoFood" data-i18n="food_none">No Food (कोई भोजन नहीं)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="field-label" data-i18n="lbl_pax_nickname">Optional Nickname / Relationship</label>
              <input id="pm-nickname" type="text" placeholder="e.g. Papa, Sister, Friend" style="width:100%;padding:8px 12px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-card);" />
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:6px;">
              <button type="submit" id="btn-save-passenger-master" class="submit-button" style="height:38px;padding:0 20px;" data-i18n="btn_save_passenger_master">
                Save Passenger Details
              </button>
            </div>
          </div>
        </form>

        <!-- Saved Passengers List -->
        <h4 style="font-size:0.95rem;margin-bottom:10px;color:var(--text-main);" data-i18n="saved_passengers_list_title">
          Saved Passengers List
        </h4>
        <div id="saved-passengers-list">
          <!-- Dynamically populated from localStorage -->
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Saved Journeys & Station Master Modal -->
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
            <input id="add-route-from" type="text" placeholder="From Station Code (e.g. ADI)" required style="padding:8px;border:1px solid var(--border-light);border-radius:6px;text-transform:uppercase;" />
            <input id="add-route-to" type="text" placeholder="To Station Code (e.g. LKO)" required style="padding:8px;border:1px solid var(--border-light);border-radius:6px;text-transform:uppercase;" />
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <button type="submit" class="btn-search-saved-route" style="padding:8px 18px;" data-i18n="btn_add_favorite_route">Save This Route</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 4. User Dashboard Modal -->
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
        <!-- Dashboard Summary Stats -->
        <div class="dashboard-grid-stats">
          <div class="dash-stat-box">
            <span class="stat-number" id="stat-passengers-count">0</span>
            <span class="stat-desc" data-i18n="stat_passengers">Saved Passengers</span>
          </div>
          <div class="dash-stat-box">
            <span class="stat-number" id="stat-journeys-count">3</span>
            <span class="stat-desc" data-i18n="stat_routes">Saved Routes</span>
          </div>
          <div class="dash-stat-box">
            <span class="stat-number" id="stat-bookings-count">0</span>
            <span class="stat-desc" data-i18n="stat_bookings">Booking Records</span>
          </div>
        </div>

        <!-- Dashboard Action Menu List -->
        <div class="dashboard-menu-links">
          <button type="button" class="dash-menu-row" id="dash-menu-passengers">
            <span class="dash-icon">👤</span>
            <div class="dash-info">
              <strong data-i18n="menu_passengers">Passenger Master</strong>
              <small>Manage family and co-travelers</small>
            </div>
            <span class="dash-arrow">➔</span>
          </button>

          <button type="button" class="dash-menu-row" id="dash-menu-journeys">
            <span class="dash-icon">⭐</span>
            <div class="dash-info">
              <strong data-i18n="menu_journeys">Saved Journeys</strong>
              <small>Favorite routes &amp; station shortcuts</small>
            </div>
            <span class="dash-arrow">➔</span>
          </button>

          <button type="button" class="dash-menu-row" id="dash-menu-history">
            <span class="dash-icon">📋</span>
            <div class="dash-info">
              <strong data-i18n="menu_history">Booking History</strong>
              <small>Assisted journey reservations</small>
            </div>
            <span class="dash-arrow">➔</span>
          </button>

          <button type="button" class="dash-menu-row" id="dash-menu-install">
            <span class="dash-icon">📲</span>
            <div class="dash-info">
              <strong data-i18n="menu_install_app">Install RailPlus App</strong>
              <small>Fast home-screen access</small>
            </div>
            <span class="dash-arrow">➔</span>
          </button>

          <button type="button" class="dash-menu-row" id="dash-menu-clear" style="color:#b91c1c;">
            <span class="dash-icon">🗑️</span>
            <div class="dash-info">
              <strong data-i18n="menu_clear_data">Reset / Clear All Saved Data</strong>
              <small>Erase stored local passengers &amp; routes</small>
            </div>
            <span class="dash-arrow">➔</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Site Footer -->
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-col">
        <div class="footer-brand">
          <img src="logo.png" alt="RailPlus" style="width:24px;height:24px;object-fit:contain;" />
          <span style="font-weight:700;color:#ffffff;font-size:1.05rem;">Rail<span style="color:#22c55e;">Plus</span>.in</span>
        </div>
        <p style="font-size:0.8rem;color:#94a3b8;margin-top:8px;" data-i18n="footer_desc">
          Smart Indian Railway travel companion and booking assistance platform.
        </p>
      </div>

      <div class="footer-col">
        <h4 style="color:#ffffff;font-size:0.85rem;margin-bottom:8px;" data-i18n="footer_useful_links">Quick Navigation</h4>
        <ul style="list-style:none;padding:0;margin:0;font-size:0.8rem;color:#cbd5e1;line-height:1.8;">
          <li><a href="#pnr" style="color:#cbd5e1;text-decoration:none;">PNR Status Enquiry</a></li>
          <li><a href="#search" style="color:#cbd5e1;text-decoration:none;">Train Search &amp; Schedule</a></li>
          <li><a href="#live" style="color:#cbd5e1;text-decoration:none;">Live Train Running Status</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 style="color:#ffffff;font-size:0.85rem;margin-bottom:8px;" data-i18n="footer_helpline_security">Helpline &amp; Security</h4>
        <ul style="list-style:none;padding:0;margin:0;font-size:0.8rem;color:#cbd5e1;line-height:1.8;">
          <li data-i18n="footer_helpline">Railway Helpline: 139 (24x7)</li>
          <li data-i18n="footer_privacy">Security: No Aadhaar or IRCTC passwords stored.</li>
          <li data-i18n="footer_encryption">Client-side local sandbox encryption.</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 RailPlus.in — All Rights Reserved. Indian Railways and IRCTC are registered trademarks of their respective owners.</span>
    </div>
  </footer>

  <script src="config.js?v=20.0"></script>
  <script src="app.js?v=20.0"></script>
</body>
</html>
`;

fs.writeFileSync('website/index.html', html);
console.log('Successfully written clean unified website/index.html');
