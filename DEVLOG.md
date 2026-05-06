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
Date: TBD
Status: Planned

### Features To Build
- Splash screen with Silverstone logo animation
- Logo on auth screens
- Input validation for phone, TIN, NIDA, amount
- Real Firestore charts replacing placeholder data
- KYC status tracker on pending screen
- Request detail modal
- Biometric auth fingerprint and face ID
- Push notifications
- Relative timestamps
- Offline support with sync
- Agent network phone management screen
- Editable profile fields
- Pull to refresh on all lists
- Dark mode audit to fix hardcoded colors
- Request card press animation
- Tab badges showing pending counts

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
Last updated: May 2025
