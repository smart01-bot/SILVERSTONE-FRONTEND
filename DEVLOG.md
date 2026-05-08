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
- Splash screen PNG logo swap ✓ (completed Session 6)
- Push token registration + Expo Push API for cross-device notifications
- Biometric preference persistence via AsyncStorage
- Pull to refresh on all lists (MyRequests, QueueScreen, etc.)
- Dark mode audit: remaining hardcoded colors in TransfersScreen, AgentsScreen, ApprovalsScreen
- Request card swipe-to-reject gesture (QueueScreen)
- Hero card pulse animation (HomeScreen)

---

## Session 3 — Critical Reset
Date: May 2026
Status: Complete

### Changes
- Expo downgraded from 55 to 51 (most stable for standalone APK builds)
- expo-dev-client removed — was causing Expo Go login screen on launch
- All dependencies updated to Expo 51 compatible versions
- eas.json updated: all profiles now build standalone APK (developmentClient: false, buildType: apk)
- app.json: added android.versionCode: 1
- Node version locked to 20.19.4 via .nvmrc and .node-version
- package.json engines field added: node >=20.19.4
- npm scripts updated to include nvm setup inline
- Deleted orphaned src/firebase/firestore.js — was importing db from ./config (non-existent); canonical file is src/utils/firestore.js

### Root Cause of Expo Go Screen
eas.json had developmentClient: true in the development profile.
This flags the build to expect a running Metro server and shows
the Expo Go login screen instead of launching the app directly.
Fix: developmentClient: false + buildType: apk in all profiles.

---

## How To Run
Start dev server: npm start
Build preview APK: npm run build:android
Build dev APK: npm run build:dev
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

## Session 4 — Firebase APK Crash Fix
Date: May 2026
Status: Complete

### Problem
Android APK crashed immediately on launch with "Silverstone keeps stopping".
Root cause: `auth/invalid-api-key` — `EXPO_PUBLIC_*` env vars are not embedded
into standalone APK builds by EAS; `process.env` reads return undefined at runtime.

### Fix
- `app.json` → added all Firebase config values to `expo.extra` (embedded at build time)
- `src/config/firebase.js` → switched from `process.env` to `Constants.expoConfig.extra`
- `package.json` → added `expo-constants: ~16.0.0` as explicit dependency

---

## Session 5 — Hardened Firebase Config + ErrorBoundary
Date: May 2026
Status: Complete

### Changes
- `app.json`: bumped `android.versionCode` to 2
- `src/config/firebase.js`: switched to optional chaining (`Constants.expoConfig?.extra ?? {}`) and added guard throw if `apiKey` is missing — surfaces the real error instead of a silent crash
- `App.js`: wrapped entire app in `ErrorBoundary` class component — shows readable error message + stack trace + Retry button instead of blank "keeps stopping" crash screen

### Why
APK was crashing silently with no visible error. ErrorBoundary surfaces the actual exception so future crashes are debuggable from the device screen alone.

---

## Session 6 — PIN Routing Fix
Date: May 2026
Status: Complete

### Changes
- `AuthContext.jsx`: `hasPinSet` now checks both SecureStore AND `profile.pinSet`; `savePin` updates local profile state so AppNavigator re-routes immediately; added `resetPin` (clears SecureStore + Firestore + signs out)
- `AppNavigator.jsx`: `useEffect` now depends on `[user, profile]` and checks both SecureStore and Firestore before setting `pinSet`; routing simplified to `if (!pinSet) → pinSetup`
- `PinSetupScreen.jsx`: removed broken `navigation.replace('App')` — AppNavigator re-routes automatically when profile updates
- `PinLoginScreen.jsx`: added "Forgot PIN / Reset PIN" button with confirmation alert

---

## Session 7 — PIN Routing + Overflow Fix
Date: May 2026
Status: Complete

### Root Cause
`AuthNavigator` accepted no props, so `initialRouteName="PinSetup"` (and `"Pending"`)
passed from `AppNavigator` were silently dropped. The navigator always defaulted to
`PinLogin`, causing new users to see the PIN entry screen even before setting a PIN.

### Changes
- `AuthNavigator.jsx`: added `initialRouteName = 'PinLogin'` prop + passed to `Stack.Navigator` — this is the core fix
- `AppNavigator.jsx`: refactored to `state = { checked, pinExists }` object; deps changed to `[user?.uid, profile?.pinSet]` so effect re-fires when PIN is saved; `authReady` now derived from `route !== 'loading'`; try-catch around SecureStore read
- `AuthContext.jsx`: `logout` now wraps SecureStore delete in try/catch and uses optional chaining on `user?.uid`
- `PinLoginScreen.jsx`: wrapped in `KeyboardAvoidingView` + `ScrollView`; `SafeAreaView` uses `edges={['top','bottom']}`; `paddingBottom: 60` on scroll container; removed duplicate `useAuth()` call; `handleResetPin` extracted to named function
- `PinSetupScreen.jsx`: `SafeAreaView` uses `edges={['top','bottom']}`; automatic re-routing via `profile.pinSet` state update in `savePin` (no explicit navigate needed)

### Login Flow (post-fix)
New user: Email login → approved + pinSet=false → PinSetup screen → save PIN → AppNavigator auto-routes to dashboard
Returning user: App open → user cached + pinExists=true → PinLogin screen → correct PIN → dashboard
Reset PIN: PinLogin → "Reset PIN" → SecureStore cleared + pinSet=false → signs out → Email login

---

## Session 8 — Device Theme + Remove Toggle Buttons
Date: May 2026
Status: Complete

### Changes
- `ThemeContext.jsx`: replaced manual `toggleTheme` with `useColorScheme()` device detection; added `userPreference` state (null = auto, 'light', 'dark'); `setTheme('auto'|'light'|'dark')` persists to `silverstone_theme_preference` key; `isDark` derives from user preference first, then device scheme; `toggleTheme` removed from context entirely
- `PinLoginScreen.jsx`: removed sun/moon toggle button from header; removed `isDark`/`toggleTheme` from `useTheme()` destructuring
- `CreateAccountScreen.jsx`: same — removed toggle button and unused `themeBtn` style
- `HomeScreen.jsx`: same — removed toggle icon button from top bar; removed `isDark`/`toggleTheme` from `useTheme()` destructuring; removed unused `iconBtn` style
- `ProfileScreen.jsx`: replaced single toggle button with 3-button Auto/Light/Dark selector; destructuring updated to `setTheme, userPreference`; added `themeOptions` and `themeOptionBtn` styles; removed `toggleBtn` style

### Theme Behavior
- Fresh install → follows device dark/light mode automatically (Auto)
- User can override in Profile → Theme → ☀️ Light / 🌙 Dark / 📱 Auto
- Preference persists across app restarts via AsyncStorage
- SplashScreen continues to use `isDark` for gradient (no change needed)

---

## Session 9 — Full Auth Flow: 5-Min Lock + Forgot PIN
Date: May 2026
Status: Complete

### Auth Flows Implemented

**First time:**
Register → Pending → Approved (admin sets Firestore) → PinSetup → Dashboard

**Returning user, backgrounded < 5 min:**
App resumes → sessionUnlocked still true → straight to Dashboard (no PIN)

**Returning user, backgrounded > 5 min or app fully killed:**
App opens → sessionUnlocked=false → PinLogin → correct PIN → Dashboard

**Forgot PIN:**
PinLogin → "Reset PIN" → ForgotPinScreen → enter password → reauthenticate →
resetPinOnly() clears SecureStore + sets pinSet=false → AppNavigator routes to
PinSetup → new PIN → markSessionUnlocked → Dashboard (no sign-out)

**Logout:**
Dashboard → Sign Out → SecureStore cleared + signOut + sessionUnlocked=false → Email login

### Changes
- `AuthContext.jsx`: added `sessionUnlocked` state; `AppState` listener locks session
  after >5 min background; `verifyPin` calls `markSessionUnlocked` on success;
  added `markSessionUnlocked()`, `reauthenticate(password)`, `resetPinOnly()`;
  `logout` and `resetPin` both clear sessionUnlocked; imported `EmailAuthProvider`
  and `reauthenticateWithCredential` from firebase/auth
- `AppNavigator.jsx`: added `pinLogin` route; reads `sessionUnlocked` from context;
  route order: auth → pending → pinSetup → pinLogin → dashboard
- `AuthNavigator.jsx`: added `ForgotPin` screen to stack
- `ForgotPinScreen.jsx`: new screen — email (read-only) + password input →
  reauthenticate → resetPinOnly → AppNavigator auto-routes to PinSetup
- `PinSetupScreen.jsx`: calls `markSessionUnlocked()` after `savePin` so newly
  created PIN routes directly to dashboard without re-locking
- `PinLoginScreen.jsx`: "Forgot PIN" navigates to ForgotPinScreen (no longer
  signs out); biometric success calls `markSessionUnlocked()`; removed Alert import

### Key Design Decisions
- `sessionUnlocked` lives in AuthContext (not AppNavigator) so it's accessible
  to all screens that need to unlock the session (biometric, verifyPin, PinSetup)
- Background timer uses `useRef` (not AsyncStorage) — resets on app kill, which
  is the correct behavior (killed app always requires PIN)
- Forgot PIN stays signed in (reauthenticate, not signOut+signIn) — smoother UX,
  user goes Forgot PIN → new PIN → dashboard without re-entering email

---

## Session 10 — Complete Login Flow Redesign
Date: May 2026
Status: Complete

### Auth Flows

**First time:**
Register → Pending (real-time status via onSnapshot) → Approved → PinSetup (4-digit) → Dashboard

**Returning user, backgrounded < 5 min:**
App resumes → sessionLocked=false → straight to Dashboard (no PIN)

**Returning user, app killed or backgrounded > 5 min:**
App opens → onSnapshot fires → pinSet=true → sessionLocked=true → LockStack overlay (PinEntryScreen) → correct PIN or biometric → unlockSession() → Dashboard

**Forgot PIN (inside lock overlay):**
PinEntryScreen → "Forgot PIN?" → ForgotPinScreen (in LockStack) → enter password → login(email, password) to verify → resetPin() clears SecureStore + sets pinSet=false → unlockSession() → AppNavigator sees sessionLocked=false + pinExists=false → routes to PinSetup → new PIN → unlockSession() → Dashboard (never signed out)

**Logout:**
Any screen → Sign Out → SecureStore + AsyncStorage cleared + signOut → Email login screen

**Rejected account:**
status=rejected in Firestore → AppNavigator routes to RejectedScreen → contact support or sign out

### Changes

- `src/utils/pinLockout.js` — NEW: 3 failed attempts → 30-min lockout stored in AsyncStorage; exports `recordFailedAttempt`, `checkLockout`, `clearLockout`

- `src/context/AuthContext.jsx` — REWRITE: uses `onSnapshot` real-time listener (not getDoc); `profileUnsubRef` ref for cleanup; `hasInitializedSession` ref prevents re-locking on profile updates; `sessionLocked` replaces `sessionUnlocked`; removed `reauthenticate`, `resetPinOnly`, `markSessionUnlocked`, `hasPinSet`; added `checkPinExists()`, `resetPin()` (no sign-out), `unlockSession()`; AppState listener uses AsyncStorage timestamp; authLoading covers both auth + first profile load

- `src/navigation/AppNavigator.jsx` — REWRITE: `LockStack` created at file level; when `sessionLocked=true` renders independent `NavigationContainer` with PinEntryScreen + ForgotPinScreen; `getScreen()` returns auth|pending|rejected|pinSetup|subAgent|mainAgent (no pinEntry route — overlay handles all PIN gating)

- `src/navigation/AuthNavigator.jsx` — UPDATED: added `Rejected` screen; removed `ForgotPin` and `PinEntry` (now in LockStack); accepts `initialRouteName` prop

- `src/screens/auth/PinEntryScreen.jsx` — NEW: 4-digit PIN, square boxes (56×56, borderRadius 10); inline custom keypad; biometric support; lockout countdown; `isSessionUnlock` prop navigates to ForgotPin within LockStack; `unlockSession()` on success

- `src/screens/auth/ForgotPinScreen.jsx` — REWRITE: uses `login(user.email, password)` + `resetPin()` + `unlockSession()` (removed `reauthenticate`/`resetPinOnly`)

- `src/screens/auth/PinSetupScreen.jsx` — UPDATED: PIN length changed 6→4; calls `unlockSession()` after `savePin()` (was `markSessionUnlocked`)

- `src/screens/auth/PinLoginScreen.jsx` — STRIPPED: removed all PIN mode logic (PinPad, verifyPin, biometric, handleForgotPin); now email/password form only; AppNavigator + LockStack handle all PIN gating

- `src/screens/auth/PendingScreen.jsx` — UPDATED: removed own Firestore `onSnapshot` listener; reads `profile` from AuthContext (already real-time); removed `navigation.replace('PinSetup')` — AppNavigator handles routing on status change

- `src/screens/auth/RejectedScreen.jsx` — NEW: rejection message, contact support link, sign out button

### Key Design Decisions
- `sessionLocked` boolean is the single source of truth for PIN gating — starts false, set true on first profile load if `pinSet=true`, also set true by AppState if >5 min background; `unlockSession()` sets it false
- `hasInitializedSession` ref (not state) prevents every subsequent Firestore update from re-locking the session
- LockStack uses `independent` NavigationContainer so it works as a full-screen overlay over whichever main navigator is active without routing conflicts
- PendingScreen no longer manages its own snapshot — AuthContext's listener is already real-time, so AppNavigator re-renders automatically when `profile.status` changes to approved
- Forgot PIN stays authenticated (re-verify password via `login()`, not `reauthenticate()`) — user goes directly to PinSetup then Dashboard without seeing the login screen

---

## Session 11 — Complete Auth System Rebuild
Date: May 2026
Status: Complete

### Auth Flow (final, canonical)

**RULE 1 — Email login shown only when:**
No Firebase cached user, OR user explicitly logged out, OR tapped "Sign in as different user"

**RULE 2 — PIN entry shown only when:**
Firebase user exists + profile.status=approved + profile.pinSet=true + SecureStore has PIN

**RULE 3 — PIN setup shown only when:**
Firebase user exists + profile.status=approved + pinSet=false OR SecureStore empty

**RULE 4 — Pending screen:** profile.status=pending — auto-advances via onSnapshot when admin approves

**RULE 5 — Rejected screen:** profile.status=rejected

**RULE 6 — Dashboard:** only after PIN entry succeeds OR PIN setup completes

**RULE 7 — Session timeout:** 5 min background → PIN overlay on top of dashboard, no navigation away

### Files Changed

**New files:**
- `src/screens/auth/LoginScreen.jsx` — email/password only; forgot password via resetPassword(); no PIN logic
- `src/screens/auth/RegisterScreen.jsx` — 3-step form (Personal → Business → Identity); validates per step; routes to Pending automatically

**Rewritten:**
- `src/utils/pinLockout.js` — updated keys (sstone_*); resets attempt counter after lockout
- `src/context/AuthContext.jsx` — clean rewrite; onSnapshot listener; hasInitializedSession ref; sessionLocked gate; all required methods
- `src/navigation/AppNavigator.jsx` — removed LockStack/independent NavigationContainer; PIN overlay now rendered as absoluteFillObject View outside main NavigationContainer; PendingScreen/RejectedScreen/PinSetupScreen rendered directly (no navigator); lockOverlayScreen state switches between PinEntry and ForgotPin inside overlay
- `src/navigation/AuthNavigator.jsx` — Login + Register only (removed Pending/Rejected/PinSetup/ForgotPin — those are no longer in this navigator)
- `src/screens/auth/PinSetupScreen.jsx` — inline keypad (no PinPad component); Animated shake on PIN mismatch; unlockSession() after savePin()
- `src/screens/auth/PinEntryScreen.jsx` — onForgotPin callback prop (no navigation.navigate); isSessionUnlock hides "Switch account"; always calls unlockSession() on success
- `src/screens/auth/ForgotPinScreen.jsx` — onBack callback prop (no navigation); login()+resetPin() on success; no explicit routing (state cascade auto-routes to PinSetup)
- `src/screens/auth/PendingScreen.jsx` — reads profile from AuthContext; no own Firestore listener; no manual navigation (AppNavigator watches profile.status)
- `src/screens/auth/RejectedScreen.jsx` — simple rejection screen; logout() button

**Deleted:**
- `src/screens/auth/PinLoginScreen.jsx` — replaced by LoginScreen.jsx
- `src/screens/auth/CreateAccountScreen.jsx` — replaced by RegisterScreen.jsx
- `src/screens/auth/PinScreens.jsx` — orphaned legacy file (was never imported)

### Key Architecture

**PIN overlay approach:** AppNavigator renders the dashboard (SubAgent/MainAgent navigator) inside NavigationContainer, then conditionally renders PinEntryScreen or ForgotPinScreen as an absolute overlay (StyleSheet.absoluteFillObject) outside the NavigationContainer. This means:
- Dashboard renders in background (protected by Firebase Auth rules)
- Overlay covers everything including tab bar
- `sessionLocked` is the single gate for both cold-start and session-timeout PIN
- No LockStack, no independent NavigationContainer needed

**Routing state cascade for Forgot PIN:**
1. User enters wrong password → error shown
2. Correct password → login() + resetPin() → profile.pinSet=false via onSnapshot
3. AppNavigator useEffect re-fires → checkPinExists() → false → pinExists=false
4. Overlay condition: sessionLocked && pinExists → false → overlay gone
5. Main route: approved && !pinExists → PinSetupScreen shown automatically
6. User sets new PIN → savePin() + unlockSession() → dashboard

**No manual navigation after auth state changes** — AppNavigator watches [user?.uid, profile?.pinSet, profile?.status] and re-routes automatically.

---

## Session 12 — Haptics, Sharing, Clipboard, Keep Awake
Date: May 2026
Status: Complete

### Completed
- expo-haptics ~13.0.0 installed and wired to all interactions
- expo-sharing ~12.0.0 installed
- expo-clipboard ~7.0.0 installed
- expo-keep-awake ~13.0.0 installed
- src/utils/haptics.js created (lightTap, mediumTap, heavyTap, successTap, errorTap, warningTap)
- src/utils/sharing.js created (generateReceiptText, shareReceipt, copyToClipboard, copyRequestId)
- src/utils/keepAwake.js created (startKeepAwake, stopKeepAwake with tag 'queue-processing')
- src/components/Toast.jsx created (Animated fade, success/error/info types, 2s auto-hide)
- RequestCard: lightTap on press; long-press copies short ID to clipboard with 1.5s "✓ Copied!" indicator
- PinPad: lightTap on every digit and delete press; removed unused Vibration import
- NewRequestScreen: mediumTap on submit button press; successTap on successful submission
- RequestDetailModal: mediumTap on Approve; heavyTap + startKeepAwake on Process Transfer; successTap + stopKeepAwake after process completes; warningTap on Reject confirm
- MyRequestsScreen: Share Receipt button below completed request cards; copies WhatsApp-ready receipt text; Toast confirms copy
- Receipt sharing falls back to clipboard (Sharing.shareAsync requires file URI); user pastes directly into WhatsApp

---
Last updated: May 2026
