# Silverstone — Development Log
Tanzania's First Float Management System
React Native + Expo 55 + Firebase Auth + Firestore

---

## Session 1 — Project Foundation
Date: May 2025
Status: Complete

### Completed
- Initialized React Native + Expo project (upgraded from 51 to 55)
- Firebase Auth + Firestore connected via .env (EXPO_PUBLIC_FIREBASE_*)
- Auth flow: 3-step KYC registration → pending screen → 4-digit PIN setup → PIN login
- Sub-agent portal: home dashboard, new request form, request history, profile
- Main agent dashboard: overview, queue, transfers, agents, approvals
- Dark/light mode with persistent AsyncStorage
- EN/SW translations via useTr() hook
- Firestore security rules deployed
- EAS Build configured
- DEVLOG.md created

### Errors Encountered and Fixes
- auth/invalid-api-key → deleted duplicate src/firebase/config.js
- Expo tunnel failing → switched to EAS Build
- Node v20.18.1 outdated → nvm use 20.19.4 + unset NPM_CONFIG_PREFIX
- libglib-2.0.so.0 missing → cosmetic warning only, does not affect app
- EAS Build failed org.asyncstorage not found → downgraded async-storage to 2.1.0
- Expo Go not loading → moved to EAS Build APK
- .env not loading → renamed all vars to EXPO_PUBLIC_FIREBASE_*

### Current Dependencies
- expo: ~55.0.23
- react-native: 0.76.0
- firebase: ^10.x
- @react-native-async-storage/async-storage: 2.1.0
- expo-secure-store: ~55.0.13
- expo-linear-gradient: ~55.0.13
- expo-local-authentication: ~55.0.13
- expo-notifications: ~55.0.22
- react-native-chart-kit: ^6.x
- @react-navigation/native: ^6.x
- @react-navigation/bottom-tabs: ^6.x
- @react-navigation/native-stack: ^6.x

### Project Structure
src/config/firebase.js — Firebase init reads from .env
src/constants/theme.js — LIGHT/DARK color tokens
src/constants/networks.js — Voda/Yas/Airtel/Halotel + colors
src/constants/translations.js — EN + SW strings
src/context/AuthContext.jsx — Firebase Auth + Firestore profile
src/context/ThemeContext.jsx — Dark mode + language persisted
src/navigation/AppNavigator.jsx — Root router
src/navigation/AuthNavigator.jsx — Auth flow
src/navigation/SubAgentNavigator.jsx
src/navigation/MainAgentNavigator.jsx
src/screens/auth/SplashScreen.jsx — TODO
src/screens/auth/CreateAccountScreen.jsx
src/screens/auth/PendingScreen.jsx
src/screens/auth/PinSetupScreen.jsx
src/screens/auth/PinLoginScreen.jsx
src/screens/sub-agent/HomeScreen.jsx
src/screens/sub-agent/NewRequestScreen.jsx
src/screens/sub-agent/MyRequestsScreen.jsx
src/screens/sub-agent/ProfileScreen.jsx
src/screens/sub-agent/NetworksScreen.jsx — TODO
src/screens/main-agent/OverviewScreen.jsx
src/screens/main-agent/QueueScreen.jsx
src/screens/main-agent/TransfersScreen.jsx
src/screens/main-agent/AgentsScreen.jsx
src/screens/main-agent/ApprovalsScreen.jsx
src/components/StatusBadge.jsx
src/components/NetworkBadge.jsx
src/components/PinPad.jsx
src/components/RequestCard.jsx
src/components/RequestDetailModal.jsx — TODO
src/hooks/useNotifications.js — TODO
src/hooks/useOfflineQueue.js — TODO
src/utils/firestore.js — All Firestore CRUD helpers
src/utils/validation.js — TODO
src/utils/time.js — TODO

### Firestore Data Model
agents/{uid}: name, phone, email, role, status, networks, agentPhoneNumbers, businessName, businessLocation, regNo, tin, nida, pinSet, expoPushToken, createdAt, approvedAt
requests/{requestId}: agentId, agentName, sourceNetwork, destNetwork, sourcePhone, destPhone, amount, urgent, status, queuePosition, createdAt, processedAt, processedBy
transactions/{txId}: requestId, agentId, agentName, sourceNetwork, destNetwork, amount, processedBy, createdAt

---

## Session 2 — Features and Polish
Date: May 2026
Status: Complete

### Completed
- KYC status tracker: animated 4-step tracker in PendingScreen with Firestore onSnapshot; auto-navigates to PinSetup on approval
- RequestDetailModal: bottom sheet with swipe-to-dismiss, full request details, sub-agent (cancel/retry) and main-agent (approve/process/reject) actions
- RequestCard: press scale animation (0.97 on press), left border colored by sourceNetwork
- time.js utility: timeAgo() with EN/SW support, covers seconds through years
- useOfflineQueue hook: NetInfo-based online/offline detection, AsyncStorage queue, auto-sync on reconnect
- Offline banners on HomeScreen, NewRequestScreen, QueueScreen (red banner when offline, green toast on sync)
- NetworksScreen: manage all 4 networks with phone inputs, active toggles, phone validation, Firestore save
- ProfileScreen: editable Name, Phone, BusinessLocation fields (inline edit + Firestore save); My Networks navigation
- SubAgentNavigator: ProfileStack wrapping ProfileScreen + NetworksScreen; RequestDetailModal on HomeScreen and MyRequestsScreen
- MainAgentNavigator: live pending-request badge on Queue tab, pending-approval badge on Approvals tab
- HomeScreen: RefreshControl, pending count badge on My Requests quick action, offline banner
- QueueScreen: replaced inline modal with RequestDetailModal; per-filter empty states; offline banner
- SplashScreen: tagline fixed to "Tanzania's First Float Management System", letterSpacing 3
- validation.js: added validatePassword, validateName; fixed NIDA to accept 19 or 20 prefix; fixed amount max to 50M TZS
- package.json: added @react-native-community/netinfo ^11.0.0

### Current Dependencies
- expo: ~55.0.23
- react-native: 0.83.6
- firebase: ^12.12.1
- @react-native-async-storage/async-storage: 2.2.0
- @react-native-community/netinfo: ^11.0.0
- expo-secure-store: ~55.0.13
- expo-linear-gradient: ~55.0.13
- expo-local-authentication: ~55.0.13
- expo-notifications: ~55.0.22
- react-native-chart-kit: ^6.x
- @react-navigation/native: ^7.x
- @react-navigation/bottom-tabs: ^7.x
- @react-navigation/native-stack: ^7.x

### Features Still To Build (Session 3)
- Splash screen PNG logo swap (awaiting silverS.png asset)
- Push token registration + Expo Push API for cross-device notifications
- Biometric preference persistence via AsyncStorage
- Pull to refresh on all lists (MyRequests, QueueScreen, etc.)
- Dark mode audit: remaining hardcoded colors in TransfersScreen, AgentsScreen, ApprovalsScreen
- Request card swipe-to-reject gesture (QueueScreen)
- Hero card pulse animation (HomeScreen)

---

## How To Run
Start dev server: unset NPM_CONFIG_PREFIX && nvm use 20.19.4 && npm start
Build Android APK: eas build --profile development --platform android
Deploy Firestore rules: firebase deploy --only firestore:rules,firestore:indexes

## Environment Variables
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=

## First Time Main Agent Setup
1. Register via app — gets status pending
2. Go to Firestore Console → agents → find your document
3. Set role to main-agent and status to approved
4. Sign back in → Main Agent dashboard loads

---
Last updated: May 2026
