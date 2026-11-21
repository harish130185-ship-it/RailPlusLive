import fs from 'fs';

// Read existing app.js
const originalAppJs = fs.readFileSync('website/app.js', 'utf8');

// Build the upgraded modules to inject
const newModules = `
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
      return \`
        <div class="passenger-card" data-pax-id="\${safe(p.id)}" style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:1rem;color:#0f294a;">
              \${safe(p.name)} 
              \${p.nickname ? \`<span style="font-size:0.8rem;color:#64748b;font-weight:normal;">(\${safe(p.nickname)})</span>\` : ''}
              \${isSenior ? '<span class="card-badge" style="background:#fef3c7;color:#92400e;font-size:0.65rem;margin-left:6px;">Senior Citizen</span>' : ''}
            </div>
            <div style="font-size:0.8rem;color:#475569;margin-top:2px;">
              Age: \${safe(p.age)} • \${safe(genderLabel)} • Berth: \${safe(p.berth || 'No Preference')} • Food: \${safe(p.food || 'None')}
            </div>
          </div>
          <div>
            <button type="button" class="btn-delete-pax" data-id="\${safe(p.id)}" style="background:#fee2e2;color:#b91c1c;border:none;padding:6px 12px;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:600;">
              Delete
            </button>
          </div>
        </div>
      \`;
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
      return \`
        <div class="saved-journey-item" style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:1rem;color:#0f294a;">
              \${safe(j.fromCode)} ➔ \${safe(j.toCode)}
            </div>
            <div style="font-size:0.8rem;color:#475569;margin-top:2px;">
              \${safe(j.fromName)} to \${safe(j.toName)}
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button type="button" class="btn-use-journey" data-from="\${safe(j.fromCode)}" data-to="\${safe(j.toCode)}" data-fromname="\${safe(j.fromName)}" data-toname="\${safe(j.toName)}" style="background:#ea580c;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:0.85rem;cursor:pointer;font-weight:600;">
              Use Route ➔
            </button>
            <button type="button" class="btn-delete-journey" data-id="\${safe(j.id)}" style="background:#fee2e2;color:#b91c1c;border:none;padding:6px 10px;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:600;">
              ✕
            </button>
          </div>
        </div>
      \`;
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
    const txt = history.map((h, i) => \`\${i+1}. \${h.trainNumber} (\${h.fromCode} ➔ \${h.toCode}) on \${h.date} - \${h.passengers.length} passenger(s)\`).join('\\n');
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
      return \`
        <label class="booking-pax-item" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;border:1px solid #cbd5e1;cursor:pointer;margin-bottom:8px;">
          <input type="checkbox" class="cb-booking-pax" value="\${safe(p.id)}" \${isChecked ? 'checked' : ''} style="width:18px;height:18px;" />
          <div style="flex:1;">
            <div style="font-weight:700;color:#0f294a;font-size:0.95rem;">
              \${safe(p.name)} <span style="font-size:0.8rem;color:#64748b;">(\${safe(p.age)} yrs, \${safe(p.gender)})</span>
            </div>
            <div style="font-size:0.75rem;color:#475569;">
              Pref: \${safe(p.berth || 'No Preference')} • Food: \${safe(p.food || 'None')}
            </div>
          </div>
        </label>
      \`;
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

    reviewEl.innerHTML = \`
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
        <h4 style="margin:0 0 12px 0;color:#0f294a;font-size:1.05rem;">Journey & Passenger Review</h4>
        <div style="font-size:0.9rem;line-height:1.6;color:#334155;margin-bottom:14px;">
          <div>Train: <strong>\${safe(activeBooking.trainNumber)} — \${safe(activeBooking.trainName)}</strong></div>
          <div>From: <strong>\${safe(activeBooking.fromCode)}</strong> ➔ To: <strong>\${safe(activeBooking.toCode)}</strong></div>
          <div>Date: <strong>\${safe(formatToDDMMYYYY(activeBooking.date))}</strong> • Class: <strong>\${safe(activeBooking.cls)}</strong></div>
          <div>Quota: <strong>\${safe(activeBooking.quota)}</strong></div>
        </div>
        <h5 style="margin:12px 0 6px 0;color:#0f294a;">Passengers (\${count}):</h5>
        <div style="background:#f8fafc;padding:10px;border-radius:6px;margin-bottom:12px;">
          \${activeBooking.selectedPassengers.map((p, idx) => \`
            <div style="font-size:0.85rem;padding:4px 0;border-bottom:1px dashed #e2e8f0;">
              \${idx + 1}. <strong>\${safe(p.name)}</strong> (\${safe(p.age)}, \${safe(p.gender)}) — Berth: \${safe(p.berth || 'None')}, Food: \${safe(p.food || 'None')}
            </div>
          \`).join('')}
        </div>
        \${estFare ? \`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid #cbd5e1;font-weight:700;color:#0f294a;">
            <span>Estimated Total Fare (\${count} Pax):</span>
            <span style="color:#16a34a;font-size:1.15rem;">₹\${estFare}</span>
          </div>
        \` : ''}
      </div>
    \`;
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
      \`Passenger \${i+1}: \${p.name}, Age: \${p.age}, Gender: \${p.gender}, Berth: \${p.berth || 'No Preference'}\`
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
`;

console.log('Script parsed successfully, ready to splice.');
