# Promotify 🚀

**Promotify** is a mobile-first web and native Android app built with **React Router v7 (SSR + TypeScript)** and **Capacitor**. It helps entrepreneurs, content creators, and local business owners track which Facebook groups allow promotional posts on any given day of the week.

---

## ✨ Features

- 📅 **Day-by-Day Group Schedule Tracker**:
  - Filter groups by **Today** or inspect any day of the week (Sunday through Saturday).
  - Preloaded with **39 Central Florida Facebook groups** (Orlando, Debary, Kissimmee, Sanford, Deltona, Oviedo, etc.) and their specific posting rules.
  - Active day indicators (`S M T W T F S`) highlighting all allowed posting days per group.

- ✍️ **Saved Promotion Post Template**:
  - Editable promo post text box with auto-save to device `localStorage`.
  - One-tap **"Copy & Track"** button to copy post text to clipboard and record your last posted timestamp.
  - **Untrack** button to easily clear or reset a post timestamp.

- ⚙️ **Dynamic Schedule Editor & Customization**:
  - Add new Facebook groups.
  - Edit group names, allowed days of the week, and posting rules/notes.
  - Delete groups or reset to the original default seed schedule anytime.

- 📱 **Mobile Friendly & Android Safe Area Ready**:
  - Engineered with `viewport-fit=cover` and CSS safe-area insets (`env(safe-area-inset-top)` & `env(safe-area-inset-bottom)`) so the UI handles notch screens, status bars, and gesture navigation bars.

- 🤖 **Automated Android APK Build Pipeline**:
  - Includes a GitHub Actions CI workflow to automatically bundle the web app and compile a native Android `.apk` file using Capacitor.

---

## 🛠️ Tech Stack

- **Framework**: React Router v7 (Server-Side Rendering + Static Export)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Sleek dark mode glassmorphism theme)
- **Icons**: Lucide React
- **Mobile Container**: Capacitor v6 (Android Platform)
- **CI/CD**: GitHub Actions

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- npm 10+

### 2. Installation
```bash
git clone https://github.com/your-username/promotify.git
cd promotify
npm install
```

### 3. Development Server
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 4. Build for Production
Build the web application (both SSR server bundle and static client assets):
```bash
npm run build
```

---

## 📱 Mobile App Compilation (Capacitor)

### Syncing Native Assets
After building the production web assets, sync them to the native Android platform:
```bash
npm run build
npx cap sync android
```

### Opening in Android Studio
To run the app on an Android emulator or connected device:
```bash
npx cap open android
```

---

## ⚙️ GitHub Actions CI/CD Pipeline

The repository includes a ready-to-use GitHub Actions workflow located at `.github/workflows/android-build.yml`.

### How it works:
1. Triggers on every push to `main` or `master`, or via manual trigger (`workflow_dispatch`).
2. Sets up Node.js 20, JDK 17, and Android SDK.
3. Compiles the web application with `npm run build`.
4. Syncs web assets into Capacitor Android platform (`npx cap sync android`).
5. Compiles the native debug APK using Gradle (`./gradlew assembleDebug`).
6. Uploads the `.apk` file as a downloadable workflow artifact in GitHub Actions.

---

## 📄 Data Schema & Persistence

All schedule data and post text are automatically saved locally on your device via `localStorage`.

- `promotify_groups_v1`: Array of Facebook group objects, allowed days, and last posted dates.
- `promotify_promo_text_v1`: Your saved promotional text template.

You can click the **Reset** button in the app header at any time to restore the original seed CSV schedule.
