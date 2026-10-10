# ORION Mobile Client

This is the Expo React Native mobile client for ORION, providing an intelligent digital security layer directly on your mobile device.

## Requirements
- Node.js (v18 or newer)
- npm or yarn
- Expo Go app installed on your physical Android or iOS device
- ORION Backend running

## Installation
1. Navigate to this directory: `cd mobile`
2. Install dependencies: `npm install`

## Backend API Configuration (LAN IP)
A physical phone running Expo Go **cannot use `localhost` or `127.0.0.1`** to reach the backend running on your development computer. 

You must configure the app to connect via your computer's LAN IP address:
1. Find your IPv4 address:
   - Windows: Run `ipconfig` in the terminal and find your active adapter's IPv4 Address (e.g. `192.168.x.x`)
   - Mac/Linux: Run `ifconfig` or `ip a`
2. Open `src/config/env.js`
3. Update `API_BASE_URL` to match your IP. Example:
   ```javascript
   export const API_BASE_URL = 'http://192.168.1.100:8000';
   ```
4. Ensure your phone and your development computer are connected to the **same Wi-Fi network**.
5. Ensure your backend is listening on all interfaces (e.g. `uvicorn app.main:app --host 0.0.0.0 --port 8000`).

## How to Start the App (Expo Go)
1. Start the Expo development server:
   ```bash
   npm start
   # or
   npx expo start
   ```
2. A QR code will appear in your terminal.
3. Open the **Expo Go** app on your phone.
4. Scan the QR code.
   - Android: Use the Expo Go app's built-in scanner.
   - iOS: Open the default Camera app, scan the QR code, and tap the notification.

## Current Implemented Screens (Phase 2A)
- **Splash Screen**: Initial loading and session restoration.
- **Welcome**: First launch onboarding.
- **Sign In**: Authentication form linked to the backend via `API_BASE_URL`.
- **Home**: Main dashboard showing security status and Quick Check actions.
- **Result**: Foundation for analysis results (mocked as Pending for now).
- **History**: Foundation for past analysis history.
- **Profile**: Account info, configuration status, and sign out.

## Phase 2B TODO List
- [ ] Implement camera/gallery analysis flows.
- [ ] Implement audio recording and analysis.
- [ ] Connect the Result Screen to real ORION backend analysis endpoints.
- [ ] Populate the History Screen from the backend database.
- [ ] Enhance loading/analyzing micro-animations with Lottie or Reanimated.
- [ ] Integrate deepfake detection UX.
