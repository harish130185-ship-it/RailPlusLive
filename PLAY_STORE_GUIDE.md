# RailPlus — Google Play Store Upload & APK Guide (हिन्दी गाइड)

यह गाइड आपको **RailPlus** की **APK** (टेस्टिंग के लिए) और **AAB (Android App Bundle)** (Google Play Store पर पब्लिश करने के लिए) बनाने और आवश्यक Play Store नीतियों को पूरा करने की पूरी प्रक्रिया समझाती है।

---

## 🚀 मुख्य बदलाव जो आपके प्रोजेक्ट में तैयार कर दिए गए हैं:

1. **Live Domain कनेक्टेड:** Android ऐप अब आपकी लाइव वेबसाइट `https://www.railplus.in` से कनेक्टेड है (`android/app/src/main/res/values/strings.xml`)।
2. **Play Store Package ID:** `com.railplus.app` (Target SDK 35, Min SDK 24)।
3. **High-Resolution Icons:** Play Store और नए Android वर्जन्स के लिए सभी Mipmap आइकॉन्स (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) जनरेट कर दिए गए हैं।
4. **512x512 Play Store Icon:** `android/ic_launcher-playstore.png` तैयार है जिसे सीधे Play Console में अपलोड कर सकते हैं।
5. **Privacy Policy Page तैयार:** `https://www.railplus.in/privacy.html` बना दी गई है और वेबसाइट के फुटर में लिंक कर दी गई है (Google Play Console के लिए यह अनिवार्य है)।
6. **Government / IRCTC Disclaimer:** Play Store की Impersonation Policy के अनुसार साफ डिस्क्लेमर सेट है कि ऐप थर्ड-पार्टी स्वतंत्र ट्रैवल पोर्टल है।
7. **वेबसाइट की फंक्शनैलिटी में कोई छेड़छाड़ नहीं की गई है:** सारा फंक्शनल कोड बिल्कुल पहले जैसा और सुरक्षित है।

---

## 📱 भाग 1: अपने फोन पर टेस्ट करने के लिए APK कैसे बनाएं?

1. प्रोजेक्ट के रूट फोल्डर में मौजूद **`BUILD_ANDROID_APK.bat`** फाइल पर डबल-क्लिक करें।  
   *(यह सीधे आपके सिस्टम के Android Studio में `android` फोल्डर को खोल देगा)*।
2. Android Studio खुलने के बाद नीचे **Gradle Sync** पूरा होने का इंतज़ार करें (पहली बार 1-2 मिनट ले सकता है)।
3. ऊपर मेन्यू बार में जाएं:  
   👉 **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)** पर क्लिक करें।
4. बिल्ड पूरा होने पर नीचे दाईं ओर **"locate"** का लिंक आएगा। आपकी APK यहाँ मिलेगी:  
   📁 `android\app\build\outputs\apk\debug\app-debug.apk`
5. इस `.apk` फाइल को अपने मोबाइल में WhatsApp/Drive/USB से भेजें और इंस्टॉल करके चेक करें।

---

## 🏪 भाग 2: Google Play Store के लिए Signed AAB कैसे बनाएं?

> ⚠️ **नोट:** Google Play Store अब नई ऐप्स के लिए साधारण `.apk` स्वीकार नहीं करता, बल्कि **`.aab` (Android App Bundle)** अनिवार्य रूप से मांगता है।

### Step 1: Android Studio में Signed Bundle बनाएं:
1. Android Studio में ऊपर मेन्यू पर क्लिक करें:  
   👉 **Build** ➔ **Generate Signed Bundle / APK...**
2. **Android App Bundle** को सेलेक्ट करें और **Next** दबाएं।
3. **Key store path** के नीचे **Create new...** पर क्लिक करें:
   - **Key store path:** अपने कंप्यूटर पर कोई सुरक्षित जगह चुनें (उदा. `D:\RailPlus\railplus-release.jks`)
   - **Password:** एक मजबूत पासवर्ड डालें (इसे कहीं नोट कर लें, भविष्य के हर अपडेट में यही काम आएगा)।
   - **Alias:** `railplus`
   - **Validity (years):** 25
   - **Certificate:** First and Last Name (अपना या कंपनी का नाम लिखें)।
   - **OK** दबाएं।
4. अब **Next** पर क्लिक करें।
5. **Build Variants** में **`release`** को सेलेक्ट करें।
6. **Create** (या Finish) पर क्लिक करें।
7. बिल्ड पूरा होने पर आपकी रिलीज फाइल तैयार हो जाएगी:  
   📁 `android\app\release\app-release.aab`

---

## 📋 भाग 3: Google Play Console पर अपलोड और जरूरी सेटिंग्स

Google Play Developer Console (https://play.google.com/console) पर जाएं:

### 1. Create App
- **App name:** `RailPlus: PNR & Live Train`
- **Default language:** English (United States) या Hindi
- **App or Game:** App
- **Free or Paid:** Free
- Declarations टिक करें और **Create app** दबाएं।

### 2. Set up your store listing (Main Store Listing)
- **App name:** `RailPlus: PNR & Live Train` (अधिकतम 30 अक्षर)
- **Short description:** `Smart Indian Railway PNR enquiry, live train running status, and seat finder.`
- **Full description:**
  ```text
  RailPlus is a smart Indian Railway travel assistance companion and enquiry portal.

  Key Features:
  • PNR Status Enquiry: Check real-time booking status, confirmation probability, and chart preparation status.
  • Live Train Running Status: Track any train's current location, delay, platform updates, and upcoming stations.
  • Route & Schedule Finder: Search direct trains between any two stations with detailed timings and stoppage list.
  • Seat Availability & Fare Enquiry: Instant seat status across Sleeper, 3AC, 2AC, and 1AC classes.
  • Passenger Master: Easily manage passenger details securely on your device for quick searches.

  Disclaimer:
  RailPlus is an independent travel assistance application and is NOT affiliated with, authorized by, sponsored by, or endorsed by Indian Railways, IRCTC, CRIS, or the Government of India. Official bookings and final verification can be confirmed on official portals (irctc.co.in or indianrailrail.gov.in).
  ```
- **App Icon:** `android/ic_launcher-playstore.png` अपलोड करें (512x512 PNG)।
- **Feature Graphic:** 1024x500 PNG इमेज (RailPlus का सुंदर बैनर)।
- **Screenshots:** ऐप के 3-4 स्क्रीनशॉट्स (Phone व 7-inch tablet)।

### 3. App Content & Policies (सबसे महत्वपूर्ण - रिजेक्शन से बचने के लिए)
- **Privacy Policy URL:**  
  👉 `https://www.railplus.in/privacy.html`
- **Government Apps Declaration:**  
  👉 जब Play Store पूछे *"Does your app represent a government entity?"*  
  ➔ **No** (नहीं) सेलेक्ट करें। (क्योंकि यह थर्ड पार्टी ऐप है, अगर Yes करेंगे तो सरकारी अप्रूवल लेटर मांगेगा)।
- **Ads:**  
  👉 "No, my app does not contain ads" (यदि अभी एड्स नहीं हैं)।
- **App access:**  
  👉 "All functionality is available without restrictions".
- **Target audience and content:**  
  👉 Target age: 18 and older.
- **Financial Features:**  
  👉 "My app does not provide any financial features".
- **Data Safety:**  
  - Data collected: Minimal (Search terms, PNR for query).
  - Data encrypted in transit: **Yes (HTTPS/TLS)**.
  - Does the app provide a way for users to request data deletion: **Yes**.

### 4. Release App
1. बाएं मेन्यू में **Production** पर जाएं।
2. **Create new release** पर क्लिक करें।
3. **App bundles** में अपनी **`app-release.aab`** फाइल ड्रैग & ड्रॉप करें।
4. **Release name** में `1.0.0` लिखें।
5. **Next** ➔ **Save** ➔ **Review release** ➔ **Start rollout to Production** दबाएं।

Google टीम 1 से 3 दिनों में ऐप को रिव्यू करके Play Store पर लाइव कर देगी!
