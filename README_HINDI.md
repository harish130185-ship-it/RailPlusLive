# RailPlus — Website + Android App (Live API Ready)

यह आपकी दो फीचर वाली **वर्किंग वेबसाइट + Android Studio source project** है।

- PNR check: 10 अंकों का PNR → Booking Status, Current Status, Chart Status, Train Details
- Live Train Running Status: ट्रेन नंबर + शुरुआती तारीख → last reported status, स्टेशन टाइमलाइन, delay, progress
- Route search: स्टेशन नाम autocomplete या code → direct trains और timings; हर ट्रेन में Sleeper/3AC/2AC आदि class के अनुसार inline seat enquiry
- Seat availability: train, station codes, date, class और quota के अनुसार उपलब्धता व fare summary
- Fare enquiry: train, station codes, date, class और quota के अनुसार fare breakdown
- Mobile-friendly PWA: वेबसाइट को Android Chrome में Install कर सकते हैं
- Android Studio native wrapper: HTTPS वेबसाइट को WebView में खोलता है
- Secure Node.js backend: API Key सिर्फ server environment में, PNR history/database में save नहीं होती
- Demo का डेटा fictional है, हमेशा **DEMO** लिखा है

## वास्तविक लाइव डेटा के बारे में

RailKit एक **independent third-party** रेलवे API है, Indian Railways / IRCTC की official API नहीं। नीचे दिए दोनों REST endpoints उनके प्रकाशित दस्तावेजों पर आधारित हैं:

- `GET https://api.railkit.in/api/v1/pnr/:pnr` — Header `x-api-key`
- `GET https://api.railkit.in/api/v1/trains/:trainNumber/live/:date` — Date `DD-MM-YYYY`, ट्रेन की origin start date (IST, आज से पिछले पाँच दिन)

Station name suggestions, route, seat availability और fare lookup के लिए server पर RailKit `stationsByName`, `searchTrainBetweenStations`, `getAvailability` और `fareLookup` SDK methods इस्तेमाल होते हैं। Route search में स्टेशन नाम टाइप करके suggestion चुनें; सीट उपलब्धता उसी चुने हुए from/to segment, तारीख और class के लिए खुलती है। यदि कोई listed train उन stations पर नहीं रुकती, तो उसके वास्तविक stops की सूची से valid segment चुन सकते हैं।

संदर्भ: https://railkit.in/guides/pnr-status-api और https://railkit.in/guides/live-train-tracking-api

**ध्यान दें:** API Key इस प्रोजेक्ट में शामिल नहीं है; इसके बिना लाइव enquiry नहीं चलेगी। प्रदाता की सेवा, डेटा लाइसेंस, pricing और accuracy आपको उनके साथ सत्यापित करने होंगे। हमने credentials के बिना असली रेलवे response नहीं लिया है।

## A. Website चलाएँ (स्थानीय कंप्यूटर पर)

1. Node.js 20 या नया install करें: https://nodejs.org/
2. इस ZIP को extract करें। Terminal/CMD में इसी project directory को खोलें।
3. अपनी API Key लें: https://railkit.in/  और `.env.example` की copy `.env` बनाएँ। उसमें `RAILKIT_API_KEY=आपकी_असली_KEY` लिखें। `.env` किसी को भेजें नहीं।
4. Windows पर सबसे आसान: `START_WINDOWS.bat` को double-click करें। या command चलाएँ:

   **Windows PowerShell**
   ```powershell
   node --version
   node --env-file=.env app-server.mjs
   ```

   **Linux/macOS**
   ```bash
   node --env-file=.env app-server.mjs
   ```

5. Browser में `http://localhost:3000` खोलें। Website और `/api/health` दोनों इसी Node server से चलते हैं।
6. अपने PNR, live train, route, seat availability या fare को check करें। API key या provider error होने पर साफ error दिखाई देगा; fabricated live data नहीं।

> अगर key अभी नहीं है, `node app-server.mjs` चलाएँ: UI/demo काम करेगा, live status पर स्पष्ट API key required message मिलेगा।

## B. Live Website publish करें

1. Vercel या Node.js server support करने वाली cloud hosting (जैसे Render/Railway/VPS) चुनें। केवल static hosting (GitHub Pages) से लाइव backend नहीं चलेगा।
2. project root upload करें। Vercel पर `api/` functions deploy होंगे; दूसरे Node.js hosts पर Start command `node app-server.mjs` है और app `PORT` environment variable पढ़ता है।
3. Hosting provider की **secret environment variable** में `RAILKIT_API_KEY` सेट करें। Key को website/app code या GitHub में paste न करें।
4. HTTPS URL चालू करें; वेबसाइट और API server एक ही डोमेन पर उपलब्ध होने चाहिए।
5. अपना HTTPS URL browser में खोलें; `https://your-domain/api/health` में `ready:true` का अर्थ सिर्फ़ key **configured** है, upstream से सफल live response का प्रमाण नहीं। असली valid PNR और train पर check करके verify करें।
6. Production के लिए API usage limits, privacy policy, consent, privacy, abuse protection, hosting logging, data-sharing/licensing requirements, failure monitoring, and test coverage review करें।

## C. Android APK बनाएँ

**फोल्डर:** `android/` — यह Android Studio का Gradle project है; precompiled APK नहीं।

1. पहले ऊपर वाली वेबसाइट HTTPS domain पर deploy करें।
2. `android/app/src/main/res/values/strings.xml` में placeholder
   `https://YOUR-RailPlus-DOMAIN.example` को अपने live website URL से बदलें।
3. Android Studio में **Open** → इस project का `android` folder चुनें।
4. Gradle sync पूरा करें (JDK 17, SDK 35 और Android Gradle Plugin 8.9.2 के लिए connectivity चाहिए)। अगर IDE को Gradle wrapper की कमी दिखे, Gradle 8.11.1 install कर के `android` folder में `gradle wrapper --gradle-version 8.11.1` चलाएँ, फिर Project reload करें। इस source package में compiled Gradle wrapper/JAR शामिल नहीं है।
5. **Build → Build Bundle(s) / APK(s) → Build APK(s)** चुनें। Debug APK आमतौर पर `android/app/build/outputs/apk/debug/app-debug.apk` में होगा।
6. Public Play Store release के लिए signing key, production release, package ID, privacy policy और store requirements अलग से पूरा करें। SDK target requirements भी समय के अनुसार update करें।

**Android ऐप live website को WebView में दिखाता है**। इसका मतलब वेबसाइट internet पर accessible होना जरूरी है। Native code में कोई API Key नहीं है और official रेलवे लिंक बाहरी browser में खुलते हैं।

**बिना APK build किए Android पर अभी install:** HTTPS साइट खोलें → Chrome menu ⋮ → **Add to Home screen / Install app** (PWA install availability browser/HTTPS पर निर्भर)।

## D. Tests

```bash
npm test
```

यह provider के documented response format पर unit और server integration tests हैं। Real provider connectivity के लिए आपकी key आवश्यक है।

## Files

- `website/` — HTML/CSS/JS, PWA manifest और offline app shell
- `app-server.mjs` — local/Node-host live API gateway, response normalization, validation, request limit
- `api/` — Vercel serverless API handler
- `.env.example` — server secret configuration template
- `android/` — Android Studio WebView app source
- `tests/` — sample-based automated tests
- `START_WINDOWS.bat` / `START_MAC_LINUX.sh` — स्थानीय server चलाने के shortcuts
- `Dockerfile` — optional server deployment

## Privacy और सीमाएँ

- अपने या अनुमति वाले PNR ही चेक करें। PNR, passenger statuses संवेदनशील हो सकते हैं।
- PNR browser से आपके server को POST पर भेजा जाता है, और आगे RailKit API को HTTPS पर भेजा जाता है; इसे स्थानीय database में store नहीं किया जाता। Provider की retention/privacy policy अलग होगी।
- किसी public hosting platform के access logs/proxies का नियंत्रण आपको अलग से करना होगा।
- Train running status **last reported location** है, GPS location का दावा नहीं। Result में official provider lastUpdate और checkedAt अलग हैं।
- APIs कभी unavailable या outdated हो सकती हैं; final travel decisions Indian Railways PNR enquiry और NTES पर confirm करें:
  https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en
  https://enquiry.indianrail.gov.in/ntes/
- यह ऐप Indian Railways, CRIS या IRCTC से संबद्ध नहीं है।
